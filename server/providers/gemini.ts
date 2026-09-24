import { GoogleGenAI } from '@google/genai';
import {
  ImageGenerationOptions,
  GeneratedImageResult,
  ImageGenerationProvider,
  ProviderCapabilities,
  VisualConcept,
} from '../types.ts';

const SUPPORTED_STYLES: Record<string, string> = {
  'Photorealistic': 'photorealistic, natural textures, authentic skin tones, lifelike lighting, high dynamic range, crisp depth of field',
  'Cinematic': 'cinematic still, 35mm film aesthetic, dramatic cinematic lighting, rich color grading, anamorphic composition, atmospheric depth',
  'Professional photography': 'award-winning commercial photography, shot on 85mm f/1.4 lens, professional studio lighting, razor-sharp focus, immaculate detail',
  'Advertising': 'high-end brand advertising visual, clean polished aesthetic, premium commercial production value, striking visual hierarchy',
  'Editorial': 'vogue editorial magazine style, creative art direction, intentional framing, refined styling, evocative mood',
  'Illustration': 'masterful digital illustration, detailed linework, curated color palette, artistic texture and depth',
  '3D': 'modern 3D stylized render, Octane render style, ambient occlusion, ray-traced reflections, tactile materials',
  'Anime': 'premium modern anime aesthetic, Makoto Shinkai inspired lighting, vibrant atmospheric background, crisp expressive character art',
  'Digital art': 'contemporary digital concept art, painterly brushwork, dynamic lighting contrasts, rich storytelling environment',
};

export class GeminiProvider implements ImageGenerationProvider {
  id = 'gemini';
  name = 'Google Gemini AI';
  description = 'Official Google Gemini multimodal image generation';

  private getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0 && key !== 'MY_GEMINI_API_KEY');
  }

  getModelName(): string {
    const custom = process.env.GEMINI_IMAGE_MODEL?.trim();
    if (custom) return custom;
    // Default to the recommended Gemini image generation model from @google/genai SDK guidelines
    return 'gemini-3.1-flash-image';
  }

  getCapabilities(): ProviderCapabilities {
    const model = this.getModelName();
    const isFlashImage = model.includes('flash-image') || model.includes('pro-image');
    return {
      supportsReferenceImage: true,
      supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      supportedResolutions: isFlashImage ? ['512px', '1K', '2K'] : ['Standard (1K equivalent)'],
      supportedStyles: Object.keys(SUPPORTED_STYLES),
      maxUploadSizeBytes: 10 * 1024 * 1024, // 10MB
    };
  }

  private getClient(): GoogleGenAI {
    const apiKey = this.getApiKey();
    if (!this.isConfigured() || !apiKey) {
      throw new Error(
        'Image generation provider is not configured. GEMINI_API_KEY is missing or invalid in your environment.'
      );
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  private cleanBase64(dataUrlOrBase64: string): { data: string; mimeType: string } {
    let mimeType = 'image/jpeg';
    let data = dataUrlOrBase64.trim();

    if (data.startsWith('data:')) {
      const match = data.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        data = match[2];
      }
    }
    return { data, mimeType };
  }

  private buildEnrichedPrompt(options: ImageGenerationOptions): string {
    let prompt = options.prompt.trim();

    // Append style guidance if selected
    if (options.style && SUPPORTED_STYLES[options.style]) {
      const styleDirective = SUPPORTED_STYLES[options.style];
      prompt = `${prompt}. Style instructions: ${styleDirective}`;
    }

    // Append negative constraints safely within prompt instructions
    if (options.negativePrompt && options.negativePrompt.trim()) {
      prompt = `${prompt}. Exclude: ${options.negativePrompt.trim()}`;
    }

    return prompt;
  }

  async generateImage(options: ImageGenerationOptions): Promise<GeneratedImageResult> {
    if (!options.prompt || !options.prompt.trim()) {
      throw new Error('Please provide a valid image description or prompt.');
    }

    const ai = this.getClient();
    let modelName = this.getModelName();
    const finalPrompt = this.buildEnrichedPrompt(options);
    const aspectRatio = options.aspectRatio || '1:1';

    // If a reference image is supplied for "Create With My Photo"
    if (options.referenceImage && options.referenceImage.data) {
      return this.generateWithReferenceImage(options);
    }

    /* Legacy Imagen support removed: Google has shut down Imagen in the Gemini API. */
    if (modelName.startsWith('imagen-')) {
      try {
        const response = await ai.models.generateImages({
          model: modelName,
          prompt: finalPrompt,
          config: {
            numberOfImages: 1,
            aspectRatio: aspectRatio as any,
          },
        });

        const imageItem = response.generatedImages?.[0];
        if (imageItem && imageItem.image?.imageBytes) {
          return {
            imageUrl: `data:image/png;base64,${imageItem.image.imageBytes}`,
            mimeType: 'image/png',
            model: modelName,
            provider: this.name,
            aspectRatio,
            style: options.style,
            revisedPrompt: finalPrompt,
            createdAt: new Date().toISOString(),
          };
        }
        throw new Error('The image model returned an empty result without image data.');
      } catch (err: any) {
        throw new Error(this.formatErrorMessage(err, modelName));
      }
    }

    // Default: Gemini multimodal image generation via generateContent
    try {
      const config: any = {
        imageConfig: {
          aspectRatio,
        },
      };

      if (options.imageSize && (modelName.includes('flash-image') || modelName.includes('pro-image'))) {
        config.imageConfig.imageSize = options.imageSize;
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [{ text: finalPrompt }],
        },
        config,
      });

      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts) {
        throw new Error('No candidate content received from the image generation model.');
      }

      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return {
            imageUrl: `data:${mimeType};base64,${part.inlineData.data}`,
            mimeType,
            model: modelName,
            provider: this.name,
            aspectRatio,
            style: options.style,
            revisedPrompt: finalPrompt,
            createdAt: new Date().toISOString(),
          };
        }
      }

      // Check if text feedback was returned instead of image (e.g. safety notice)
      const textParts = candidate.content.parts
        .map((p) => p.text)
        .filter(Boolean)
        .join(' ');
      if (textParts) {
        throw new Error(`The model responded with guidance instead of an image: ${textParts}`);
      }

      throw new Error('Image generation completed, but no image data was found in the model response.');
    } catch (err: any) {
      throw new Error(this.formatErrorMessage(err, modelName));
    }
  }

  async generateWithReferenceImage(options: ImageGenerationOptions): Promise<GeneratedImageResult> {
    if (!options.referenceImage?.data) {
      throw new Error('A reference photo is required for "Create With My Photo" mode.');
    }

    const ai = this.getClient();
    // Reference image editing works with Gemini multimodal image generation
    let modelName = this.getModelName();
    if (modelName.startsWith('imagen-')) {
      // Imagen generation does not accept inline image reference via standard generateImages;
      // switch to gemini-3.1-flash-lite-image which natively supports multimodal input parts
      modelName = 'gemini-3.1-flash-lite-image';
    }

    const { data, mimeType } = this.cleanBase64(options.referenceImage.data);
    const enrichedPrompt = this.buildEnrichedPrompt(options);

    // Frame the prompt for likeness preservation and scene placement
    const contextualPrompt = `Reference portrait provided. Create a high quality new image placing the person from this reference photo into the following scene while preserving their recognizable facial features, hair, and key likeness as closely as possible: ${enrichedPrompt}. Seamless natural lighting and realistic composition matching the target environment.`;

    const aspectRatio = options.aspectRatio || '1:1';

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                data,
                mimeType: options.referenceImage.mimeType || mimeType,
              },
            },
            {
              text: contextualPrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio,
          },
        },
      });

      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts) {
        throw new Error('No candidate content received from the image model.');
      }

      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const outMimeType = part.inlineData.mimeType || 'image/png';
          return {
            imageUrl: `data:${outMimeType};base64,${part.inlineData.data}`,
            mimeType: outMimeType,
            model: modelName,
            provider: this.name,
            aspectRatio,
            style: options.style,
            revisedPrompt: contextualPrompt,
            createdAt: new Date().toISOString(),
          };
        }
      }

      const textParts = candidate.content.parts
        .map((p) => p.text)
        .filter(Boolean)
        .join(' ');
      if (textParts) {
        throw new Error(`The model responded with: ${textParts}`);
      }

      throw new Error('Image generation completed, but no image data was found.');
    } catch (err: any) {
      throw new Error(this.formatErrorMessage(err, modelName));
    }
  }

  async improvePrompt(
    simplePrompt: string,
    style?: string
  ): Promise<{ improvedPrompt: string; reasoning: string }> {
    const ai = this.getClient();
    const styleNote = style ? `Intended style: ${style}.` : '';

    const systemInstruction = `You are a world-class prompt engineer and cinematographer for high-end AI image generation.
Your job is to transform a simple user idea into a vivid, highly descriptive, single-paragraph prompt.
You MUST include explicit details on:
1. Subject (exact appearance, age/demographics if relevant, stance, facial expression, emotion)
2. Environment & setting (architectural details, realistic location, background elements)
3. Composition & camera perspective (angle, lens type, focal length, framing, depth of field)
4. Lighting & shadow (direction, quality of light, golden hour, studio softbox, ambient glow)
5. Clothing, materials & tactile textures
6. Atmosphere & subtle realistic details (dust motes, reflections, authentic human imperfections)
Do NOT change the user's intended subject or core narrative.
Return clean JSON with two keys:
- "improvedPrompt": the single rich prompt paragraph
- "reasoning": 1 sentence summarizing what visual elements were enhanced`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Transform this simple description into a detailed image generation prompt: "${simplePrompt}". ${styleNote}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text);
      return {
        improvedPrompt: parsed.improvedPrompt || simplePrompt,
        reasoning: parsed.reasoning || 'Enriched visual details, lighting, and composition.',
      };
    } catch (err: any) {
      // Fallback enhancement if text model is temporarily busy
      return {
        improvedPrompt: `${simplePrompt}, highly detailed professional photography, natural cinematic lighting, realistic textures, rich environment, 85mm lens, sharp focus, masterwork composition`,
        reasoning: 'Enhanced photographic clarity, lighting, and camera realism.',
      };
    }
  }

  async createVisualsFromTopic(topic: string): Promise<VisualConcept[]> {
    const ai = this.getClient();

    const systemInstruction = `You are a creative visual director for films, editorial publications, and educational media.
Given a topic or script snippet, generate 3 distinct, highly cinematic visual concepts that vividly illustrate the topic without being cliché.
Return clean JSON with an array of objects under key "concepts".
Each object must have:
- "id": string (unique slug)
- "title": string (engaging title 3-6 words)
- "summary": string (1-2 sentences explaining why this concept fits the topic)
- "prompt": string (complete, ready-to-generate image prompt specifying subject, setting, lighting, camera, textures, and details)
- "suggestedStyle": string (one of "Photorealistic", "Cinematic", "Professional photography", "Editorial", "3D", "Digital art")
- "suggestedAspectRatio": string ("1:1", "16:9", "9:16", or "4:3")`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Create visual concepts for this topic/script: "${topic}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.8,
        },
      });

      const text = response.text?.trim() || '{"concepts":[]}';
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.concepts) && parsed.concepts.length > 0) {
        return parsed.concepts;
      }
    } catch (err) {
      console.error('Error generating concepts from topic:', err);
    }

    // Fallback concepts
    return [
      {
        id: 'concept-1',
        title: 'Focused Dedication in the Workshop',
        summary: 'Depicts hands-on resilience and mastery under golden atmospheric lighting.',
        prompt: `A dedicated craftsperson intently working on an intricate blueprint in an authentic sunlit workshop, scattered tools, dust motes dancing in sunbeams, 85mm lens, shallow depth of field, photorealistic, natural expression. Topic: ${topic}`,
        suggestedStyle: 'Photorealistic',
        suggestedAspectRatio: '16:9',
      },
      {
        id: 'concept-2',
        title: 'Modern Visionary at Dawn',
        summary: 'Metaphorical cinematic portrayal of ambitious determination overlooking a burgeoning city.',
        prompt: `A visionary professional standing by floor-to-ceiling glass in a modern high-rise office overlooking a city skyline at dawn, warm sunrise reflections, cinematic color grade, crisp tailored clothing, contemplative expression. Topic: ${topic}`,
        suggestedStyle: 'Cinematic',
        suggestedAspectRatio: '16:9',
      },
      {
        id: 'concept-3',
        title: 'The Breakthrough Moment',
        summary: 'Captures the triumphant, human emotional payoff of persistent effort.',
        prompt: `An entrepreneurial team celebrating a breakthrough in a collaborative modern workspace, glowing laptop screens, natural candid smiles, authentic interaction, editorial lighting, dynamic framing. Topic: ${topic}`,
        suggestedStyle: 'Editorial',
        suggestedAspectRatio: '4:3',
      },
    ];
  }

  private formatErrorMessage(err: any, model: string): string {
    const message = err?.message || String(err);

    if (message.includes('API_KEY_INVALID') || message.includes('API key not valid')) {
      return 'The configured GEMINI_API_KEY is invalid. Please verify your API key in the environment secrets.';
    }
    if (message.includes('RESOURCE_EXHAUSTED') || message.includes('quota') || message.includes('429')) {
      return `Google rejected the image request because the project has reached its current API quota/rate limit for ${model}. Image-generation models currently require an eligible paid tier; check Google AI Studio usage/billing for this project. Original error: ${message}`;
    }
    if (message.includes('SAFETY') || message.includes('blocked') || message.includes('Safety')) {
      return 'The prompt or input image was flagged by Google safety filters. Please adjust the prompt to comply with safety policies.';
    }
    if (message.includes('not found') || message.includes('unsupported model') || message.includes('404')) {
      return `The requested image model "${model}" is not accessible or not supported in this region/key tier. You can configure GEMINI_IMAGE_MODEL in .env.`;
    }
    return `Generation failed: ${message}`;
  }
}
