export interface ReferenceImagePayload {
  data: string; // Base64 encoded string without data url prefix, or with prefix
  mimeType: string; // e.g. "image/jpeg", "image/png", "image/webp"
}

export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  style?: string;
  imageSize?: '512px' | '1K' | '2K' | '4K';
  referenceImage?: ReferenceImagePayload;
}

export interface GeneratedImageResult {
  imageUrl: string; // data:image/png;base64,...
  mimeType: string;
  model: string;
  provider: string;
  aspectRatio: string;
  style?: string;
  revisedPrompt?: string;
  createdAt: string;
}

export interface ProviderCapabilities {
  supportsReferenceImage: boolean;
  supportedAspectRatios: string[];
  supportedResolutions: string[];
  supportedStyles: string[];
  maxUploadSizeBytes: number;
}

export interface ImageGenerationProvider {
  id: string;
  name: string;
  description: string;
  isConfigured(): boolean;
  getModelName(): string;
  getCapabilities(): ProviderCapabilities;
  generateImage(options: ImageGenerationOptions): Promise<GeneratedImageResult>;
  generateWithReferenceImage?(options: ImageGenerationOptions): Promise<GeneratedImageResult>;
}

export interface VisualConcept {
  id: string;
  title: string;
  summary: string;
  prompt: string;
  suggestedStyle: string;
  suggestedAspectRatio: '1:1' | '16:9' | '9:16' | '4:3';
}
