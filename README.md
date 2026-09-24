# AI Image Studio

A simple, polished AI image-generation studio for beginners. Describe an image in normal language, choose a style and size, and generate it. It also supports creating a new scene from a user's own reference photo.

## What it does

- Text to image
- Create with my photo (reference-image mode with an ownership/consent check)
- Prompt improvement
- Visual ideas from a topic
- Photorealistic, cinematic, advertising, editorial, illustration, 3D, anime and digital-art styles
- 1:1, 16:9, 9:16 and 4:3 formats
- Download and regenerate images
- Session-only gallery; no login or database required by the app

## Important: image API availability and cost

The app uses Google's current Gemini image-generation API. Google currently lists Gemini 3.1 Flash Image as a current image model, while Imagen has been shut down for the Gemini API. Google's pricing page currently lists the Gemini image-generation models without a Free Tier, so an API project intended to generate images needs the appropriate paid/billing access. Do not describe this application as unlimited-free image generation. citeturn0search0turn0search2

The text-only prompt assistant can use a Gemini Flash text model with a free tier where available, but that does not make image generation free. Rate limits are applied at the project level. citeturn0search1turn0search2

## Setup

1. Create or open a Google AI Studio / Gemini API project.
2. Put the API key in the server environment as `GEMINI_API_KEY`. Never expose it in browser code.
3. Use `gemini-3.1-flash-image` as the default image model, or explicitly set another currently supported Google image model in `GEMINI_IMAGE_MODEL`.
4. Install dependencies with `npm install`.
5. Run with `npm run dev`.
6. Build with `npm run build` and start with `npm start`.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `GEMINI_API_KEY` | Server-side Gemini API key | none |
| `GEMINI_IMAGE_MODEL` | Google image-generation model | `gemini-3.1-flash-image` |
| `AI_IMAGE_PROVIDER` | Active provider | `gemini` |
| `PORT` | Express port | `3000` |

## User experience

The intended flow is deliberately simple:

1. **Describe** — type what you want.
2. **Choose** — pick a style and aspect ratio.
3. **Generate** — click the main Generate button.
4. **Download** — save the result or regenerate it.

For a personal image, switch to **Create With My Photo**, upload a portrait, confirm you have permission to use the likeness, describe the new scene, and generate.

The application never invents a fake image URL when generation fails. Errors from the provider are surfaced as actionable messages instead.

## Architecture

React + Vite frontend → Express API → provider manager → Gemini provider.

The provider interface is intentionally kept separate so another image provider can be added later without rewriting the UI.

## Security and privacy

- API keys remain server-side.
- Reference images are accepted in memory for the generation request; the app does not require a database.
- Uploads are limited to JPEG, PNG and WEBP and 10 MB.
- The reference-photo flow requires an explicit ownership/permission confirmation.
- The app does not fabricate successful generation results.

## Current model notes

Google's current documentation says Nano Banana image models are the current path for image generation and that Imagen is shut down for the Gemini API. This repository therefore does not rely on Imagen for its normal generation flow. citeturn0search0

If Google changes model names or availability, update the environment model value rather than hard-coding an obsolete model into the frontend.
