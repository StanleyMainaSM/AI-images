import { ImageGenerationProvider, ProviderCapabilities } from '../types.ts';
import { GeminiProvider } from './gemini.ts';

export class ProviderManager {
  private static instance: ProviderManager;
  private providers: Map<string, ImageGenerationProvider> = new Map();
  private activeProviderId: string = 'gemini';

  private constructor() {
    // Register official Google Gemini provider
    this.registerProvider(new GeminiProvider());

    // Allow overriding default provider via environment variable
    const envProvider = process.env.AI_IMAGE_PROVIDER?.toLowerCase().trim();
    if (envProvider && this.providers.has(envProvider)) {
      this.activeProviderId = envProvider;
    }
  }

  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  public registerProvider(provider: ImageGenerationProvider): void {
    this.providers.set(provider.id.toLowerCase(), provider);
  }

  public getActiveProvider(): ImageGenerationProvider {
    const provider = this.providers.get(this.activeProviderId);
    if (!provider) {
      // Fallback to first available provider
      const first = Array.from(this.providers.values())[0];
      if (!first) {
        throw new Error('No image generation providers have been registered.');
      }
      return first;
    }
    return provider;
  }

  public setActiveProvider(id: string): boolean {
    const normalized = id.toLowerCase().trim();
    if (this.providers.has(normalized)) {
      this.activeProviderId = normalized;
      return true;
    }
    return false;
  }

  public getAllProviders(): Array<{
    id: string;
    name: string;
    description: string;
    isConfigured: boolean;
    isActive: boolean;
    model: string;
    capabilities: ProviderCapabilities;
  }> {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      isConfigured: p.isConfigured(),
      isActive: p.id === this.activeProviderId,
      model: p.getModelName(),
      capabilities: p.getCapabilities(),
    }));
  }

  public getStatus() {
    const active = this.getActiveProvider();
    const isConfigured = active.isConfigured();
    return {
      providerId: active.id,
      providerName: active.name,
      modelName: active.getModelName(),
      isConfigured,
      capabilities: active.getCapabilities(),
      message: isConfigured
        ? `Ready to generate with ${active.name} (${active.getModelName()})`
        : 'Image generation provider is not configured. GEMINI_API_KEY is not set.',
    };
  }
}

export const providerManager = ProviderManager.getInstance();
