import { ProviderStatus, VisualConcept, SessionImage, AspectRatio } from '../types.ts';

export interface GenerateImagePayload {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: AspectRatio;
  style?: string;
  imageSize?: string;
  referenceImage?: {
    data: string;
    mimeType: string;
  };
}

export async function fetchProviderStatus(): Promise<ProviderStatus> {
  const res = await fetch('/api/provider/status');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}: Failed to fetch provider status`);
  }
  const data = await res.json();
  return data.current;
}

export async function generateImageApi(
  payload: GenerateImagePayload
): Promise<{ success: boolean; image: SessionImage }> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Generation failed with status ${res.status}`);
  }

  const raw = data.image;
  return {
    success: true,
    image: {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      imageUrl: raw.imageUrl,
      prompt: payload.prompt,
      negativePrompt: payload.negativePrompt,
      style: payload.style,
      aspectRatio: payload.aspectRatio,
      model: raw.model || 'gemini-image',
      provider: raw.provider || 'Google Gemini',
      createdAt: raw.createdAt || new Date().toISOString(),
      hasReferencePhoto: Boolean(payload.referenceImage),
    },
  };
}

export async function improvePromptApi(
  prompt: string,
  style?: string
): Promise<{ improvedPrompt: string; reasoning: string }> {
  const res = await fetch('/api/prompt/improve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, style }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to improve prompt.');
  }

  return {
    improvedPrompt: data.improvedPrompt,
    reasoning: data.reasoning,
  };
}

export async function createVisualsFromTopicApi(topic: string): Promise<VisualConcept[]> {
  const res = await fetch('/api/prompt/from-topic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate visual concepts from topic.');
  }

  return data.concepts || [];
}
