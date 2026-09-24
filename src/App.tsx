import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Wand2,
  Compass,
  Image as ImageIcon,
  Upload,
  X,
  Check,
  RotateCcw,
  Download,
  Maximize2,
  Copy,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
  Camera,
  Film,
  Brush,
  Palette,
  Eye,
  Sliders,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  AspectRatio,
  ImageStyle,
  ReferencePhoto,
  SessionImage,
  ProviderStatus,
  VisualConcept,
} from './types.ts';
import {
  fetchProviderStatus,
  generateImageApi,
  improvePromptApi,
} from './services/api.ts';
import { Header } from './components/Header.tsx';
import { TopicConceptsModal } from './components/TopicConceptsModal.tsx';
import { ImageLightbox } from './components/ImageLightbox.tsx';
import { InfoModal } from './components/InfoModal.tsx';
import { SessionGallery } from './components/SessionGallery.tsx';

const STYLES: Array<{
  name: ImageStyle;
  label: string;
  icon: React.ReactNode;
  desc: string;
}> = [
  { name: 'Photorealistic', label: 'Photorealistic', icon: <Camera className="w-3.5 h-3.5" />, desc: 'Authentic textures, natural lighting & crisp depth' },
  { name: 'Cinematic', label: 'Cinematic', icon: <Film className="w-3.5 h-3.5" />, desc: '35mm motion picture aesthetic & dramatic lighting' },
  { name: 'Professional photography', label: 'Commercial Photo', icon: <Camera className="w-3.5 h-3.5" />, desc: 'Studio lighting, 85mm lens, pristine focus' },
  { name: 'Advertising', label: 'Advertising', icon: <Sliders className="w-3.5 h-3.5" />, desc: 'High-end commercial brand campaign visual' },
  { name: 'Editorial', label: 'Editorial', icon: <Eye className="w-3.5 h-3.5" />, desc: 'High fashion & magazine art direction' },
  { name: 'Illustration', label: 'Illustration', icon: <Brush className="w-3.5 h-3.5" />, desc: 'Masterful detailed linework & curated colors' },
  { name: '3D', label: '3D Render', icon: <Layers className="w-3.5 h-3.5" />, desc: 'Ray-traced materials & soft ambient occlusion' },
  { name: 'Anime', label: 'Anime', icon: <Sparkles className="w-3.5 h-3.5" />, desc: 'Vibrant cel-shaded anime aesthetic' },
  { name: 'Digital art', label: 'Digital Art', icon: <Palette className="w-3.5 h-3.5" />, desc: 'Concept art painting with dynamic lighting' },
  { name: 'None', label: 'Raw / None', icon: <Sliders className="w-3.5 h-3.5" />, desc: 'No automatic style additions' },
];

const ASPECT_RATIOS: Array<{
  id: AspectRatio;
  label: string;
  sub: string;
  shapeClass: string;
}> = [
  { id: '1:1', label: '1:1', sub: 'Square', shapeClass: 'w-4 h-4' },
  { id: '16:9', label: '16:9', sub: 'Landscape', shapeClass: 'w-5 h-3' },
  { id: '9:16', label: '9:16', sub: 'Story / Reel', shapeClass: 'w-3 h-5' },
  { id: '4:3', label: '4:3', sub: 'Standard', shapeClass: 'w-4 h-3.5' },
];

const SAMPLE_PROMPTS = [
  {
    title: 'Nairobi Financial Investor',
    prompt:
      'A realistic professional investor in a modern Nairobi financial office reviewing an investment portfolio while discussing a secured bank loan. Cinematic professional photography, natural lighting, realistic environment.',
    style: 'Professional photography' as ImageStyle,
    ratio: '16:9' as AspectRatio,
  },
  {
    title: 'Marine Biologist at Midnight',
    prompt:
      'A marine biologist examining glowing bioluminescent coral inside a glass research tank aboard an oceanic research vessel at night. Soft blue and teal atmospheric lighting, 85mm lens, shallow depth of field, authentic candid focus.',
    style: 'Cinematic' as ImageStyle,
    ratio: '16:9' as AspectRatio,
  },
  {
    title: 'Ceramic Artisan Workshop',
    prompt:
      'A master ceramicist sculpting an intricate terracotta vessel on a pottery wheel in an earthy sun-drenched studio. Wet clay textures, dust motes dancing in warm sunbeams, authentic concentrated expression, macro lens detail.',
    style: 'Photorealistic' as ImageStyle,
    ratio: '4:3' as AspectRatio,
  },
  {
    title: 'Tropical Sustainable Architecture',
    prompt:
      'Futuristic sustainable office complex integrated with lush tropical waterfalls and hanging gardens in East Africa, solar glass panels, sunset golden hour reflections, realistic architectural photography.',
    style: 'Advertising' as ImageStyle,
    ratio: '16:9' as AspectRatio,
  },
];

export default function App() {
  // Mode: "text" | "photo"
  const [activeTab, setActiveTab] = useState<'text' | 'photo'>('text');

  // Input states
  const [prompt, setPrompt] = useState(
    'A realistic professional investor in a modern Nairobi financial office reviewing an investment portfolio while discussing a secured bank loan. Cinematic professional photography, natural lighting, realistic environment.'
  );
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNegative, setShowNegative] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('Professional photography');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');

  // Reference photo states
  const [referencePhoto, setReferencePhoto] = useState<ReferencePhoto | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Studio / Generation state
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Session gallery & selected image
  const [sessionImages, setSessionImages] = useState<SessionImage[]>([]);
  const [activeImage, setActiveImage] = useState<SessionImage | null>(null);

  // Modals
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<SessionImage | null>(null);

  // Load provider status on mount
  useEffect(() => {
    fetchProviderStatus()
      .then((status) => setProviderStatus(status))
      .catch((err) => {
        console.error('Failed to load provider status:', err);
      });
  }, []);

  // Step ticker effect during generation
  useEffect(() => {
    if (!isGenerating) {
      setGenerationStep(0);
      return;
    }

    const interval = setInterval(() => {
      setGenerationStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 2800);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Selected photo exceeds the 10MB size limit. Please select a smaller photo.');
      return;
    }

    // Validate mime
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid JPEG, PNG, or WEBP image.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (!result) return;

      const sizeKb = (file.size / 1024).toFixed(1);
      setReferencePhoto({
        data: result,
        mimeType: file.type,
        fileName: file.name,
        previewUrl: result,
        fileSizeFormatted: `${sizeKb} KB`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleClearPhoto = () => {
    setReferencePhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Improve prompt action
  const handleImprovePrompt = async () => {
    if (!prompt.trim()) return;
    setIsImproving(true);
    setError(null);
    try {
      const res = await improvePromptApi(prompt, selectedStyle !== 'None' ? selectedStyle : undefined);
      setPrompt(res.improvedPrompt);
    } catch (err: any) {
      setError(err.message || 'Failed to improve prompt.');
    } finally {
      setIsImproving(false);
    }
  };

  // Main Generate Action
  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = (customPrompt ?? prompt).trim();
    if (!finalPrompt) {
      setError('Please enter a description for the image.');
      return;
    }

    if (activeTab === 'photo') {
      if (!referencePhoto) {
        setError('Please upload a reference portrait photo to use "Create With My Photo".');
        return;
      }
      if (!consentAccepted) {
        setError('You must confirm ownership and likeness consent before generating with a reference photo.');
        return;
      }
    }

    setIsGenerating(true);
    setError(null);

    try {
      const payload: any = {
        prompt: finalPrompt,
        negativePrompt: negativePrompt.trim() || undefined,
        aspectRatio,
        style: selectedStyle !== 'None' ? selectedStyle : undefined,
      };

      if (activeTab === 'photo' && referencePhoto) {
        payload.referenceImage = {
          data: referencePhoto.data,
          mimeType: referencePhoto.mimeType,
        };
      }

      const res = await generateImageApi(payload);
      const newImage = res.image;

      setSessionImages((prev) => [newImage, ...prev]);
      setActiveImage(newImage);
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Image generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply Visual Concept from Topic
  const handleApplyConcept = (concept: VisualConcept, autoGenerate: boolean) => {
    setPrompt(concept.prompt);
    if (concept.suggestedStyle) {
      const matched = STYLES.find((s) => s.name === concept.suggestedStyle);
      if (matched) setSelectedStyle(matched.name);
    }
    if (concept.suggestedAspectRatio) {
      setAspectRatio(concept.suggestedAspectRatio);
    }
    setActiveTab('text');

    if (autoGenerate) {
      setTimeout(() => {
        handleGenerate(concept.prompt);
      }, 100);
    }
  };

  // Reuse settings from a session image
  const handleReuseSettings = (image: SessionImage) => {
    setPrompt(image.prompt);
    if (image.negativePrompt) setNegativePrompt(image.negativePrompt);
    if (image.aspectRatio) setAspectRatio(image.aspectRatio);
    if (image.style) {
      const matched = STYLES.find((s) => s.name === image.style);
      if (matched) setSelectedStyle(matched.name);
    }
    setActiveImage(image);
  };

  const handleCopyPrompt = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleDownloadActive = () => {
    if (!activeImage) return;
    const link = document.createElement('a');
    link.href = activeImage.imageUrl;
    const cleanName = activeImage.prompt
      .slice(0, 30)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    link.download = `ai-image-${cleanName || 'generated'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generation step labels
  const STEP_LABELS = [
    'Analyzing prompt semantics and composition...',
    'Synthesizing scene elements, lighting and geometry...',
    'Rendering high-fidelity textures and micro-details...',
    'Finalizing visual clarity and color grading...',
  ];

  const isConfigured = providerStatus?.isConfigured ?? true;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header */}
      <Header
        providerStatus={providerStatus}
        onOpenInfo={() => setIsInfoModalOpen(true)}
        sessionCount={sessionImages.length}
      />

      {/* Main Studio Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Unconfigured Alert Banner */}
        {!isConfigured && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Image generation provider is not configured.
                </p>
                <p className="text-xs text-amber-300/80">
                  Please configure your <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-200 font-mono">GEMINI_API_KEY</code> in the environment secrets panel to start generating images.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsInfoModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-xs font-medium transition-colors shrink-0"
            >
              Setup Guide
            </button>
          </div>
        )}

        {/* Studio Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Controls & Prompting (Cols 1-7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Mode Switcher Tabs */}
            <div className="flex p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'text'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Text to Image</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('photo')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'photo'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Create With My Photo</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                  Likeness
                </span>
              </button>
            </div>

            {/* "Create With My Photo" Upload Box */}
            {activeTab === 'photo' && (
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Reference Photo
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      (Portraits, candid headshots)
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500">Max 10MB</span>
                </div>

                {!referencePhoto ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-700 hover:border-indigo-500/70 bg-zinc-950/60 rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-zinc-950 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-zinc-900 group-hover:bg-indigo-950/50 text-zinc-400 group-hover:text-indigo-400 mx-auto flex items-center justify-center border border-zinc-800 transition-colors mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-zinc-200">
                      Click or drop a portrait photo here
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Supports JPEG, PNG, WEBP (Processed in-memory only)
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <img
                      src={referencePhoto.previewUrl}
                      alt="Reference"
                      className="w-16 h-16 rounded-lg object-cover border border-zinc-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {referencePhoto.fileName}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {referencePhoto.fileSizeFormatted} &bull; Ready for reference synthesis
                      </p>
                      <span className="inline-block mt-1 text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                        Reference Loaded
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearPhoto}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Explicit Consent & Likeness Agreement */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={(e) => setConsentAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 bg-zinc-900"
                    />
                    <span className="text-[11px] text-zinc-300 leading-snug">
                      <strong>Ownership & Consent Confirmation:</strong> I confirm that I own this photo or have explicit permission to use this person&apos;s likeness. I understand that uploaded images are processed temporarily in memory, never permanently stored, and never used for AI training.
                    </span>
                  </label>
                  <p className="text-[10px] text-zinc-500 pl-6 leading-relaxed">
                    <strong>Likeness notice:</strong> The AI model uses your facial cues to imagine you inside the described scene. Natural stylistic differences may occur depending on model capabilities.
                  </p>
                </div>
              </div>
            )}

            {/* Prompt Editor Box */}
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Image Description / Prompt</span>
                </label>
                <div className="flex items-center gap-2">
                  {/* Topic button */}
                  <button
                    type="button"
                    onClick={() => setIsTopicModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-amber-300 hover:text-amber-200 border border-amber-500/20 text-xs font-medium transition-all shadow-sm"
                    title="Brainstorm visual concepts from topic or video script"
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>Visual From Topic</span>
                  </button>

                  {/* Improve prompt button */}
                  <button
                    type="button"
                    onClick={handleImprovePrompt}
                    disabled={isImproving || !prompt.trim()}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-900/60 to-violet-900/60 hover:from-indigo-800/80 hover:to-violet-800/80 text-indigo-200 border border-indigo-500/30 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    title="Enrich with lighting, camera angles, textures, and details"
                  >
                    {isImproving ? (
                      <div className="w-3.5 h-3.5 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span>{isImproving ? 'Improving...' : 'Improve Prompt'}</span>
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    activeTab === 'photo'
                      ? 'Describe the scene to place yourself in (e.g., "Place me in a modern Nairobi investment office, sitting at a desk reviewing financial charts, realistic professional photography, natural lighting.")'
                      : 'Describe the image you want to create in detail...'
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-y min-h-[105px]"
                />
                {prompt && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="p-1 rounded bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs"
                      title="Copy Prompt"
                    >
                      {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrompt('')}
                      className="p-1 rounded bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs"
                      title="Clear"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Character counter & hint */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Tip: Press ⌘+Enter to generate</span>
                <span>{prompt.length} / 3000</span>
              </div>

              {/* Sample Prompt Inspiration Cards */}
              <div className="pt-2 border-t border-zinc-800/80">
                <span className="text-[11px] font-semibold text-zinc-400 block mb-2">
                  Sample Ideas & Use Cases:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_PROMPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPrompt(sample.prompt);
                        setSelectedStyle(sample.style);
                        setAspectRatio(sample.ratio);
                      }}
                      className="text-left p-2.5 rounded-xl bg-zinc-950/70 hover:bg-zinc-950 border border-zinc-800/70 hover:border-zinc-700 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-zinc-300 group-hover:text-indigo-300 transition-colors">
                          {sample.title}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {sample.ratio}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 line-clamp-2 leading-tight">
                        {sample.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Style Selector */}
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Visual Style
                </span>
                <span className="text-xs text-indigo-400 font-medium">
                  {selectedStyle}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {STYLES.map((st) => {
                  const isSelected = selectedStyle === st.name;
                  return (
                    <button
                      key={st.name}
                      type="button"
                      onClick={() => setSelectedStyle(st.name)}
                      className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/30'
                          : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={isSelected ? 'text-indigo-400' : 'text-zinc-500'}>
                          {st.icon}
                        </span>
                        <span className="text-xs font-semibold truncate">{st.label}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 line-clamp-1">
                        {st.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Aspect Ratio
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {aspectRatio}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((ratio) => {
                  const isSelected = aspectRatio === ratio.id;
                  return (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setAspectRatio(ratio.id)}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/30'
                          : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-800">
                        <div
                          className={`border-2 rounded-xs ${ratio.shapeClass} ${
                            isSelected ? 'border-indigo-400 bg-indigo-500/30' : 'border-zinc-500'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">{ratio.label}</span>
                        <span className="text-[10px] text-zinc-500">{ratio.sub}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Settings Accordion (Negative Prompt & Quality Specs) */}
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
              <button
                type="button"
                onClick={() => setShowNegative(!showNegative)}
                className="w-full flex items-center justify-between text-xs font-bold text-zinc-300 hover:text-white uppercase tracking-wider transition-colors"
              >
                <span>Advanced Directives & Resolution</span>
                {showNegative ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </button>

              {showNegative && (
                <div className="pt-2 space-y-4 border-t border-zinc-800 animate-in fade-in duration-150">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300 block">
                      Negative Prompt (Elements to avoid)
                    </label>
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder='e.g., "blurry, low quality, oversaturated, deformed hands, cartoonish"'
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Resolution capability indicator */}
                  <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
                      Provider Resolution Support
                    </span>
                    <p className="text-zinc-300 text-xs">
                      Active model (<span className="font-mono text-indigo-300">{providerStatus?.modelName || 'gemini-3.1-flash-lite-image'}</span>) renders standard 1K native output across all aspect ratios.
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Higher multi-res (512px, 1K, 2K, 4K) is available by setting <code className="text-zinc-400">GEMINI_IMAGE_MODEL=&quot;gemini-3.1-flash-image&quot;</code> in your environment.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 shadow-lg shadow-red-950/20">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-semibold text-white block mb-0.5">Generation Error</span>
                  {error}
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Primary Generate CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-4 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-500 hover:from-indigo-500 hover:via-violet-500 hover:to-amber-400 transition-all shadow-xl shadow-indigo-600/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Synthesizing Image...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>
                      {activeTab === 'photo'
                        ? 'Generate Scene With My Likeness'
                        : 'Generate High-Quality Image'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Workspace & Preview Area (Cols 8-12) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4 sticky top-20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span>Studio Preview</span>
                </span>
                {activeImage && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {activeImage.aspectRatio} &bull; {activeImage.style || 'Custom'}
                  </span>
                )}
              </div>

              {/* Main Canvas Viewport */}
              <div
                className={`relative w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/80 flex items-center justify-center transition-all ${
                  aspectRatio === '16:9'
                    ? 'aspect-video'
                    : aspectRatio === '9:16'
                    ? 'aspect-[9/16] max-h-[560px] mx-auto'
                    : aspectRatio === '4:3'
                    ? 'aspect-[4/3]'
                    : 'aspect-square'
                }`}
              >
                {/* Generation Loading State */}
                {isGenerating ? (
                  <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center z-20">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-amber-500 p-0.5 animate-pulse shadow-xl shadow-indigo-500/20">
                        <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
                        </div>
                      </div>
                      <div className="absolute -inset-4 bg-indigo-500/20 blur-xl rounded-full -z-10 animate-pulse" />
                    </div>

                    <h3 className="text-sm font-bold text-white mb-2 tracking-wide">
                      Generating AI Image
                    </h3>
                    <p className="text-xs text-indigo-300 font-medium max-w-xs transition-all duration-300">
                      {STEP_LABELS[generationStep]}
                    </p>

                    {/* Progress step indicators */}
                    <div className="flex gap-1.5 mt-6">
                      {[0, 1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            step <= generationStep
                              ? 'w-6 bg-indigo-500'
                              : 'w-2 bg-zinc-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : activeImage ? (
                  /* Generated Image Display */
                  <div className="relative w-full h-full group">
                    <img
                      src={activeImage.imageUrl}
                      alt={activeImage.prompt}
                      className="w-full h-full object-contain bg-black"
                    />

                    {/* Quick overlay buttons */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={() => setLightboxImage(activeImage)}
                        className="p-2 rounded-xl bg-black/70 hover:bg-black text-white backdrop-blur-sm transition-all"
                        title="Fullscreen view"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleDownloadActive}
                        className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
                        title="Download PNG"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty state placeholder */
                  <div className="p-8 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 text-zinc-500">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-300">
                      Studio Canvas Empty
                    </p>
                    <p className="text-[11px] text-zinc-500 max-w-xs mt-1">
                      Enter a prompt or select a sample idea on the left, then click{' '}
                      <strong className="text-zinc-400">Generate High-Quality Image</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Toolbar for Active Image */}
              {activeImage && !isGenerating && (
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadActive}
                      className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PNG</span>
                    </button>
                    <button
                      onClick={() => handleGenerate()}
                      className="px-4 py-2.5 rounded-xl font-medium text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
                      title="Regenerate with current settings"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Regenerate</span>
                    </button>
                    <button
                      onClick={() => setLightboxImage(activeImage)}
                      className="p-2.5 rounded-xl text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
                      title="Inspect Fullscreen"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Metadata readout */}
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] space-y-1.5 text-zinc-400">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>Model:</span>
                      <span className="font-mono text-indigo-300">{activeImage.model}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Generated:</span>
                      <span>{new Date(activeImage.createdAt).toLocaleTimeString()}</span>
                    </div>
                    {activeImage.hasReferencePhoto && (
                      <div className="flex items-center gap-1 text-amber-300 text-[10px] pt-1 border-t border-zinc-800">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Preserved identity reference photo</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Session Gallery */}
        <SessionGallery
          images={sessionImages}
          selectedImageId={activeImage?.id}
          onSelectImage={(img) => setActiveImage(img)}
          onOpenLightbox={(img) => setLightboxImage(img)}
          onReusePrompt={handleReuseSettings}
          onDeleteImage={(id) => {
            setSessionImages((prev) => prev.filter((i) => i.id !== id));
            if (activeImage?.id === id) {
              const remaining = sessionImages.filter((i) => i.id !== id);
              setActiveImage(remaining.length > 0 ? remaining[0] : null);
            }
          }}
          onClearAll={() => {
            setSessionImages([]);
            setActiveImage(null);
          }}
        />
      </main>

      {/* Lightbox Modal */}
      <ImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
        onReusePrompt={handleReuseSettings}
      />

      {/* Topic Concepts Brainstorm Modal */}
      <TopicConceptsModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        onSelectConcept={handleApplyConcept}
      />

      {/* Architecture, Privacy & Safety Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        providerStatus={providerStatus}
      />
    </div>
  );
}
