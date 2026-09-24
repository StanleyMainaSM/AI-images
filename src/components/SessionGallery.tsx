import React from 'react';
import { Download, Maximize2, Sparkles, Trash2, Layers, AlertCircle } from 'lucide-react';
import { SessionImage } from '../types.ts';

interface SessionGalleryProps {
  images: SessionImage[];
  selectedImageId?: string;
  onSelectImage: (image: SessionImage) => void;
  onOpenLightbox: (image: SessionImage) => void;
  onReusePrompt: (image: SessionImage) => void;
  onDeleteImage: (id: string) => void;
  onClearAll: () => void;
}

export const SessionGallery: React.FC<SessionGalleryProps> = ({
  images,
  selectedImageId,
  onSelectImage,
  onOpenLightbox,
  onReusePrompt,
  onDeleteImage,
  onClearAll,
}) => {
  if (images.length === 0) return null;

  const handleDownload = (e: React.MouseEvent, image: SessionImage) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = image.imageUrl;
    const cleanName = image.prompt
      .slice(0, 30)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    link.download = `ai-image-${cleanName || 'studio'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="mt-12 pt-8 border-t border-zinc-800/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Current Session Gallery</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-normal">
                {images.length} {images.length === 1 ? 'image' : 'images'}
              </span>
            </h2>
            <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
              <span>Stored in this browser session only; not saved in a permanent database.</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClearAll}
          className="text-xs font-medium text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1 self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Session</span>
        </button>
      </div>

      {/* Grid of session images */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {images.map((img) => {
          const isSelected = img.id === selectedImageId;
          return (
            <div
              key={img.id}
              onClick={() => onSelectImage(img)}
              className={`group relative rounded-xl overflow-hidden border bg-zinc-950 cursor-pointer transition-all duration-200 aspect-square ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <img
                src={img.imageUrl}
                alt={img.prompt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              {/* Aspect ratio badge */}
              <div className="absolute top-2 left-2 z-10">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-zinc-300 border border-white/10">
                  {img.aspectRatio}
                </span>
              </div>

              {/* Hover overlay with action buttons */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5 z-10">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteImage(img.id);
                    }}
                    className="p-1 rounded-md bg-black/60 hover:bg-red-500/30 text-zinc-400 hover:text-red-300 transition-colors"
                    title="Remove from session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <p className="text-[11px] text-zinc-200 line-clamp-2 leading-tight mb-2">
                    {img.prompt}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLightbox(img);
                      }}
                      className="flex-1 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-[10px] font-medium text-white transition-colors flex items-center justify-center gap-1"
                      title="Enlarge"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={(e) => handleDownload(e, img)}
                      className="p-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                      title="Download PNG"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
