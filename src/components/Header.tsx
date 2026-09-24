import React from 'react';
import { Sparkles, Shield, Cpu, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ProviderStatus } from '../types.ts';

interface HeaderProps {
  providerStatus: ProviderStatus | null;
  onOpenInfo: () => void;
  sessionCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  providerStatus,
  onOpenInfo,
  sessionCount,
}) => {
  const isConfigured = providerStatus?.isConfigured ?? false;

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                AI Image Studio
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 tracking-wider">
                Pro
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Generative Visuals & Reference Likeness Photography
            </p>
          </div>
        </div>

        {/* Center / Right status & actions */}
        <div className="flex items-center space-x-3">
          {/* Provider status badge */}
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isConfigured
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
            }`}
          >
            {isConfigured ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <div className="flex items-center gap-1.5">
              <span className="hidden md:inline text-zinc-400">Model:</span>
              <span className="font-mono font-medium truncate max-w-[130px] sm:max-w-[200px]">
                {providerStatus?.modelName || 'gemini-3.1-flash-image'}
              </span>
            </div>
          </div>

          {/* Session count */}
          {sessionCount > 0 && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>{sessionCount} generated</span>
            </div>
          )}

          {/* Info / Architecture modal button */}
          <button
            onClick={onOpenInfo}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-300 hover:text-white transition-all shadow-sm"
            title="Architecture, Privacy & Model Info"
          >
            <Info className="w-4 h-4 text-zinc-400" />
            <span className="hidden sm:inline">About & Safety</span>
          </button>
        </div>
      </div>
    </header>
  );
};
