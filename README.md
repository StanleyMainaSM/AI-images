# AI Image Studio

A full-stack, production-grade web application for generating high-quality AI images from descriptive text prompts and personalized reference photos with likeness preservation.

Developed with the official Google `@google/genai` SDK and an extensible provider architecture.

---

## Table of Contents
1. [Core Features](#core-features)
2. [Architecture Overview](#architecture-overview)
3. [Installation & Setup](#installation--setup)
4. [Configuring Environment Variables](#configuring-environment-variables)
5. [How Text-to-Image Generation Works](#how-text-to-image-generation-works)
6. [How "Create With My Photo" Likeness Works](#how-create-with-my-photo-likeness-works)
7. [Smart Visual Prompt Assistant](#smart-visual-prompt-assistant)
8. [Provider & Model Capabilities Matrix](#provider--model-capabilities-matrix)
9. [How to Switch Image Providers and Models](#how-to-switch-image-providers-and-models)
10. [Privacy, Security & Likeness Consent](#privacy-security--likeness-consent)
11. [Cost & Transparency Policy](#cost--transparency-policy)

---

## Core Features

- **Text-to-Image Generation**: Turn detailed natural language scene descriptions into high-resolution, photorealistic, or artistic images.
- **"Create With My Photo" Mode**: Upload your own portrait photo with consent verification; the system places your likeness into the scene you describe.
- **Smart Visual Prompt Assistant**:
  - **✨ Improve Prompt**: Enhances simple descriptions into cinematographic prompts detailing subject, environment, lighting, lens/camera, textures, and atmosphere.
  - **💡 Visual From Topic / Script**: Brainstorms 3 distinct, creative visual concepts from any topic, quote, or video script (e.g., *"Work hard and build your future"*).
- **Style Presets**: Photorealistic, Cinematic, Professional Photography, Advertising, Editorial, Illustration, 3D, Anime, Digital Art, or Raw.
- **Standard Aspect Ratios**: 1:1 (Square), 16:9 (Landscape), 9:16 (Story / Reel), and 4:3 (Standard).
- **Session-Only Image Gallery**: Preview, inspect full-resolution, download local PNGs, and reuse prompt settings during your browser session without a database.
- **Real Backend Security**: All Google GenAI SDK calls and API keys remain strictly on the server-side (`server.ts`).

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │          React Frontend (Vite)         │
                      │  - Prompt Editor & Style Controls      │
                      │  - "Create With My Photo" Uploader     │
                      │  - Session Gallery & Lightbox Viewer   │
                      └──────────────────┬─────────────────────┘
                                         │ HTTP JSON API (/api/*)
                                         ▼
                      ┌────────────────────────────────────────┐
                      │          Express Server Backend        │
                      │  - server.ts                           │
                      │  - File validation & Payload checks    │
                      │  - Strict in-memory photo processing   │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │        Provider Manager Layer          │
                      │  (ImageGenerationProvider Interface)   │
                      │  - ProviderManager: getActiveProvider()│
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │         Google Gemini Provider         │
                      │  - @google/genai SDK (v2.4+)           │
                      │  - GEMINI_IMAGE_MODEL configurable    │
                      │  - Text assistance via gemini-3.8-flash│
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │         Google AI Studio API           │
                      │  - gemini-3.1-flash-lite-image         │
                      │  - gemini-3.1-flash-image              │
                      │  - imagen-3.0-generate-002             │
                      └────────────────────────────────────────┘
```

The server abstracts image generation through the `ImageGenerationProvider` interface:
```typescript
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
```

---

## Installation & Setup

### Prerequisites
- Node.js 20+ or 22+
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Populate `GEMINI_API_KEY` with your key from Google AI Studio.

### 3. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000` with full-stack API proxy and Vite middleware.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## Configuring Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Required for Gemini image and prompt reasoning calls. Keep secure on server. | *None* |
| `GEMINI_IMAGE_MODEL` | Configurable Google image generation model. | `gemini-3.1-flash-lite-image` |
| `AI_IMAGE_PROVIDER` | Active provider implementation in the ProviderManager. | `gemini` |
| `PORT` | HTTP port for Express server. | `3000` |

---

## How Text-to-Image Generation Works

1. The user enters a descriptive prompt in the studio workspace.
2. The user optionally selects an artistic style (e.g. *Photorealistic*, *Cinematic*, *Advertising*) and aspect ratio.
3. The server enriches the prompt directives with style tokens and negative exclusion criteria.
4. If configured with a Gemini image model (e.g. `gemini-3.1-flash-lite-image`), `ai.models.generateContent` is invoked with `imageConfig: { aspectRatio }`.
5. If configured with an Imagen model (e.g. `imagen-3.0-generate-002`), `ai.models.generateImages` is invoked.
6. The resulting image bytes are returned to the client as base64 data, rendered instantly in the canvas, and added to the current session gallery.

---

## How "Create With My Photo" Likeness Works

1. **User Uploads Portrait**: The user selects a high-quality portrait photo (JPEG, PNG, or WEBP up to 10MB).
2. **Mandatory Ownership Confirmation**: The user checks the consent checkbox confirming they own the photo or have explicit permission to use the person's likeness.
3. **In-Memory Streaming**: The photo is encoded in base64 and streamed in-memory to the server. The image is never written to disk or saved to a database.
4. **Multimodal Reference Conditioning**: The server attaches the image as an `inlineData` part alongside the prompt directive using Gemini's multimodal image model (`gemini-3.1-flash-lite-image` or `gemini-3.1-flash-image`).
5. **Likeness Preservation**: The model references facial characteristics and geometry to place the person in the newly described setting (e.g. a Nairobi financial office, an artisan workshop, or a modern architectural studio).

*Note: AI identity synthesis renders a new artistic image inspired by the reference likeness; slight variations in rendering style and facial nuance may occur depending on model capabilities.*

---

## Smart Visual Prompt Assistant

The application provides two intelligent prompt-engineering tools powered by `gemini-3.8-flash`:

### 1. "Improve Prompt"
Transforms simple phrases (such as *"person explaining hard work"*) into photographic directives:
- **Subject**: Demographic nuances, expression, gesture, and clothing.
- **Environment**: Concrete location, background depth, and architectural elements.
- **Lighting**: Quality, angle, ambient bounce, and color temperature.
- **Camera**: Focal length (e.g., 85mm f/1.4), depth of field, and angle.
- **Atmosphere**: Natural textures, dust motes, and human realism.

### 2. "Create Visual From Topic"
Allows creators to input a narrative theme or script line (e.g., *"Work hard and build your future"*). The system generates 3 complete concepts with titles, artistic rationales, full visual prompts, suggested styles, and aspect ratios.

---

## Provider & Model Capabilities Matrix

| Feature | `gemini-3.1-flash-lite-image` | `gemini-3.1-flash-image` | `imagen-3.0-generate-002` |
| :--- | :--- | :--- | :--- |
| **Provider** | Google Gemini | Google Gemini | Google Imagen |
| **Aspect Ratios** | 1:1, 16:9, 9:16, 4:3, 3:4 | 1:1, 16:9, 9:16, 4:3, 3:4 | 1:1, 16:9, 9:16, 4:3, 3:4 |
| **Reference Image Likeness** | Supported (`inlineData`) | Supported (`inlineData`) | Text-to-image primary |
| **Resolution Selection** | Standard 1K | Configurable (512px, 1K, 2K) | Standard 1K |
| **Negative Prompts** | Supported | Supported | Supported |

---

## How to Switch Image Providers and Models

### Changing the Gemini Model
Set the `GEMINI_IMAGE_MODEL` environment variable in your `.env` file:
```env
# Fast, lightweight generation with reference photo support (Default)
GEMINI_IMAGE_MODEL="gemini-3.1-flash-lite-image"

# High-resolution generation
GEMINI_IMAGE_MODEL="gemini-3.1-flash-image"

# Dedicated Imagen 3 generation
GEMINI_IMAGE_MODEL="imagen-3.0-generate-002"
```

### Adding a New Image Provider
To add a 3rd-party or custom image provider:
1. Implement the `ImageGenerationProvider` interface in `server/providers/`.
2. Register the provider in `server/providers/manager.ts`:
   ```typescript
   providerManager.registerProvider(new CustomProvider());
   ```
3. Set `AI_IMAGE_PROVIDER="custom"` in `.env`.

---

## Privacy, Security & Likeness Consent

- **No Permanent Storage**: Uploaded user photos and generated images are strictly ephemeral. The backend never writes uploads to disk, and there is no user database or tracking in v1.
- **No Model Training**: Uploaded reference photos are processed solely for the immediate generation request and are never used to train or fine-tune public models.
- **Server-Side API Key Protection**: The Google GenAI API key is accessed strictly through `process.env.GEMINI_API_KEY` on the Express server. The key is never exposed to the client or browser network logs.
- **Input Validation**: Strict file type validation (JPEG, PNG, WEBP), file size checks (10MB max), and input sanitization are enforced before processing.

---

## Cost & Transparency Policy

- **No Misleading Free Promises**: AI image generation is not "unlimited free". All API calls consume tokens or quota in your Google AI Studio or Google Cloud project.
- **No Artificial Paywalls**: The app does not simulate fake tokens, credits, or subscriptions.
