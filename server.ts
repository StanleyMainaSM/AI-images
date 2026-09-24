import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { providerManager } from './server/providers/manager.ts';
import { GeminiProvider } from './server/providers/gemini.ts';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Increase JSON payload limit to accept reference photos in base64
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health / status endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Provider status and capabilities
app.get('/api/provider/status', (_req, res) => {
  try {
    const status = providerManager.getStatus();
    const allProviders = providerManager.getAllProviders();
    res.json({
      success: true,
      current: status,
      providers: allProviders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to inspect provider status',
    });
  }
});

// Generate image endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const activeProvider = providerManager.getActiveProvider();

    if (!activeProvider.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Image generation provider is not configured. GEMINI_API_KEY environment variable is missing.',
      });
    }

    const { prompt, negativePrompt, aspectRatio, style, imageSize, referenceImage } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Prompt description is required.',
      });
    }

    if (prompt.trim().length > 3000) {
      return res.status(400).json({
        success: false,
        error: 'Prompt exceeds the maximum allowed length of 3000 characters.',
      });
    }

    // Reference image validation
    if (referenceImage) {
      if (!referenceImage.data || typeof referenceImage.data !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Invalid reference photo payload.',
        });
      }

      // Check MIME type safety
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      const mime = referenceImage.mimeType?.toLowerCase() || '';
      if (mime && !allowedMimes.includes(mime)) {
        return res.status(400).json({
          success: false,
          error: 'Unsupported image format. Please upload a JPEG, PNG, or WEBP photo.',
        });
      }

      // Size check (Base64 string ~14MB max for ~10MB file)
      if (referenceImage.data.length > 14 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'Reference photo exceeds 10MB limit. Please choose a smaller photo.',
        });
      }
    }

    const result = await activeProvider.generateImage({
      prompt: prompt.trim(),
      negativePrompt: negativePrompt?.trim() || undefined,
      aspectRatio: aspectRatio || '1:1',
      style: style || undefined,
      imageSize: imageSize || undefined,
      referenceImage: referenceImage || undefined,
    });

    return res.json({
      success: true,
      image: result,
    });
  } catch (error: any) {
    console.error('Error generating image:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Image generation failed. Please try again.',
    });
  }
});

// Prompt enhancement assistant
app.post('/api/prompt/improve', async (req, res) => {
  try {
    const { prompt, style } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a prompt to improve.',
      });
    }

    const activeProvider = providerManager.getActiveProvider();
    if (activeProvider instanceof GeminiProvider && activeProvider.isConfigured()) {
      const result = await activeProvider.improvePrompt(prompt.trim(), style);
      return res.json({
        success: true,
        improvedPrompt: result.improvedPrompt,
        reasoning: result.reasoning,
      });
    }

    // Heuristic enhancement if API is not yet configured
    const enhanced = `${prompt.trim()}, highly detailed, cinematic lighting, realistic textures, 85mm lens, sharp focus, natural environment, balanced composition`;
    return res.json({
      success: true,
      improvedPrompt: enhanced,
      reasoning: 'Enhanced prompt with standard photographic details and lighting specifications.',
    });
  } catch (error: any) {
    console.error('Error improving prompt:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to improve prompt.',
    });
  }
});

// Visual concepts from topic assistant
app.post('/api/prompt/from-topic', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a topic or script snippet.',
      });
    }

    const activeProvider = providerManager.getActiveProvider();
    if (activeProvider instanceof GeminiProvider && activeProvider.isConfigured()) {
      const concepts = await activeProvider.createVisualsFromTopic(topic.trim());
      return res.json({
        success: true,
        concepts,
      });
    }

    // Fallback concepts when key not configured
    return res.json({
      success: true,
      concepts: [
        {
          id: 'concept-1',
          title: 'Resilient Craft & Dedication',
          summary: 'Authentic artisan working intently with handcrafted materials in natural sunlight.',
          prompt: `An authentic artisan working intently on a handcrafted project in a warm sunlit workshop, dust motes in sunbeams, fine woodworking tools, 85mm lens, shallow depth of field, photorealistic, natural expression. Topic: ${topic}`,
          suggestedStyle: 'Photorealistic',
          suggestedAspectRatio: '16:9',
        },
        {
          id: 'concept-2',
          title: 'Strategic Horizon at Sunrise',
          summary: 'Contemplative professional looking out over a morning skyline, symbolizing growth.',
          prompt: `A forward-thinking investor standing beside floor-to-ceiling glass in a modern office overlooking an emerging city skyline at sunrise, golden ambient reflections, sharp tailored attire, cinematic framing. Topic: ${topic}`,
          suggestedStyle: 'Cinematic',
          suggestedAspectRatio: '16:9',
        },
        {
          id: 'concept-3',
          title: 'Dynamic Collaboration & Action',
          summary: 'A team celebrating progress around blueprints and financial charts.',
          prompt: `A collaborative team engaged in an energetic strategy review around a rustic wooden table with charts and digital tablets, candid smiles, professional editorial photography, crisp focus. Topic: ${topic}`,
          suggestedStyle: 'Professional photography',
          suggestedAspectRatio: '4:3',
        },
      ],
    });
  } catch (error: any) {
    console.error('Error creating visuals from topic:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate visual concepts.',
    });
  }
});

// Vite middleware setup
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI Image Studio] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
