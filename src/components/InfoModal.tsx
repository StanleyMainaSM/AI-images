import React from 'react';
import { X, Shield, Cpu, Layers, DollarSign, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { ProviderStatus } from '../types.ts';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerStatus: ProviderStatus | null;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  providerStatus,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Image Studio Architecture</h2>
              <p className="text-xs text-zinc-400">Architecture, Privacy, Likeness & Cost Transparency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="mt-6 space-y-6 text-sm">
          {/* Active Provider & Model Status */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
              <Cpu className="w-4 h-4" />
              <span>Active Provider & Engine</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-zinc-500 block">Active Provider</span>
                <span className="font-medium text-white">{providerStatus?.providerName || 'Google Gemini AI'}</span>
              </div>
              <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-zinc-500 block">Selected Model</span>
                <span className="font-mono font-medium text-indigo-300">
                  {providerStatus?.modelName || 'gemini-3.1-flash-image'}
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Configured via <code className="text-indigo-300 bg-zinc-900 px-1 py-0.5 rounded">GEMINI_IMAGE_MODEL</code> in your environment.
              Supports both Gemini multimodal models (e.g. <code className="text-zinc-300">gemini-3.1-flash-lite-image</code>, <code className="text-zinc-300">gemini-3.1-flash-image</code>)
              and dedicated Imagen models (e.g. <code className="text-zinc-300">imagen-3.0-generate-002</code>).
            </p>
          </div>

          {/* Privacy & Likeness Safety */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
              <Shield className="w-4 h-4" />
              <span>Zero-Storage Likeness & Privacy Policy</span>
            </div>
            <div className="space-y-2 text-xs text-zinc-300 leading-relaxed">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Strict Consent:</strong> "Create With My Photo" requires explicit user confirmation that you own the uploaded portrait or hold permission to use the person&apos;s likeness.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>In-Memory Processing Only:</strong> Uploaded reference photos are sent securely in-memory to the server and forwarded to the model endpoint. They are never written to disk, never stored in a database, and never retained.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>No Model Training:</strong> Your uploaded photos are never used to train or fine-tune public AI models.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Identity Expectation:</strong> Reference generation preserves visual cues (facial geometry, hair, demeanor) to render the new environment, but subtle artistic variations are natural.
                </span>
              </div>
            </div>
          </div>

          {/* Cost Transparency */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
              <DollarSign className="w-4 h-4" />
              <span>Cost & Rate Limit Transparency</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Image generation is not indefinitely "unlimited free". All API calls are executed against your Google AI Studio / Google Cloud project account.
              Usage is subject to Google&apos;s rate limits and billing tiers for Gemini and Imagen models.
              No arbitrary tokens, fake credits, or subscription paywalls are simulated in this application.
            </p>
          </div>

          {/* Session Storage Notice */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center space-x-2 text-blue-400 font-semibold text-xs tracking-wider uppercase">
              <Layers className="w-4 h-4" />
              <span>Session-Only Image Gallery</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Images produced are preserved solely in your current browser tab memory during this session.
              No cloud database is attached. Once you refresh or close this tab, session images will disappear unless downloaded.
              Click the <strong className="text-white">Download</strong> button on any image to save the PNG locally to your device.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
