export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3';

export type ImageStyle =
  | 'Photorealistic'
  | 'Cinematic'
  | 'Professional photography'
  | 'Advertising'
  | 'Editorial'
  | 'Illustration'
  | '3D'
  | 'Anime'
  | 'Digital art'
  | 'None';

export interface ReferencePhoto {
  data: string; // Base64
  mimeType: string;
  fileName: string;
  previewUrl: string;
  fileSizeFormatted: string;
}

export interface SessionImage {
  id: string;
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  style?: string;
  aspectRatio: AspectRatio;
  model: string;
  provider: string;
  createdAt: string;
  hasReferencePhoto?: boolean;
}

export interface ProviderStatus {
  providerId: string;
  providerName: string;
  modelName: string;
  isConfigured: boolean;
  capabilities: {
    supportsReferenceImage: boolean;
    supportedAspectRatios: string[];
    supportedResolutions: string[];
    supportedStyles: string[];
    maxUploadSizeBytes: number;
  };
  message: string;
}

export interface VisualConcept {
  id: string;
  title: string;
  summary: string;
  prompt: string;
  suggestedStyle: string;
  suggestedAspectRatio: AspectRatio;
}
