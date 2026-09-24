import React, { useEffect } from 'react';
import { X, Download, Copy, Check, Sparkles, ExternalLink, Calendar, Cpu } from 'lucide-react';
import { SessionImage } from '../types.ts';

interface ImageLightboxProps {
  image: SessionImage | null;
  onClose: () => void;
  onReusePrompt: (image: SessionImage) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  image,
  onClose,
  onReusePrompt,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!image) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(image.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.imageUrl;
    const cleanName = image.prompt
      .slice(0, 35)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    link.download = `ai-image-studio-${cleanName || 'generated'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[95vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-black/60 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur-sm transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image preview area */}
        <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[320px] md:min-h-[500px]">
          <img
            src={image.imageUrl}
            alt={image.prompt}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Sidebar details */}
        <div className="w-full md:w-88 border-t md:border-t-0 md:border-l border-zinc-800 p-6 flex flex-col justify-between bg-zinc-900/90 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold tracking-wider text-indigo-400">
                Image Details
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                {image.aspectRatio}
              </span>
            </div>

            {/* Prompt description */}
            <div className="space-y-1.5">
              <span className="text-xs text-zinc-400 font-medium">Prompt</span>
              <p className="text-xs text-zinc-200 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 max-h-40 overflow-y-auto leading-relaxed">
                {image.prompt}
              </p>
            </div>

            {image.negativePrompt && (
              <div className="space-y-1.5">
                <span className="text-xs text-zinc-400 font-medium">Negative Exclusions</span>
                <p className="text-xs text-zinc-300 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                  {image.negativePrompt}
                </p>
              </div>
            )}

            {/* Metadata badges */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase block">Style</span>
                <span className="font-medium text-zinc-200 truncate block">
                  {image.style || 'Default'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase block">Model</span>
                <span className="font-mono text-zinc-300 text-[11px] truncate block">
                  {image.model}
                </span>
              </div>
            </div>

            {image.hasReferencePhoto && (
              <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Generated with Reference Likeness photo</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-6 border-t border-zinc-800/80">
            <button
              onClick={handleDownload}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Download High-Res PNG</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyPrompt}
                className="py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
              </button>
              <button
                onClick={() => {
                  onReusePrompt(image);
                  onClose();
                }}
                className="py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Reuse Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
