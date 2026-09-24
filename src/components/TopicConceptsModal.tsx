import React, { useState } from 'react';
import { X, Lightbulb, Sparkles, ArrowRight, Wand2, Compass } from 'lucide-react';
import { VisualConcept, AspectRatio, ImageStyle } from '../types.ts';
import { createVisualsFromTopicApi } from '../services/api.ts';

interface TopicConceptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConcept: (concept: VisualConcept, autoGenerate: boolean) => void;
}

const SAMPLE_TOPICS = [
  'Work hard and build your future.',
  'Kenyan tech founder in Nairobi reviewing financial portfolio with investors.',
  'Sustainable solar-powered architecture in a vibrant savannah landscape.',
  'Master artisan handcrafting leather goods in natural studio light.',
];

export const TopicConceptsModal: React.FC<TopicConceptsModalProps> = ({
  isOpen,
  onClose,
  onSelectConcept,
}) => {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [concepts, setConcepts] = useState<VisualConcept[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (topicToUse?: string) => {
    const text = (topicToUse ?? topic).trim();
    if (!text) return;

    setIsLoading(true);
    setError(null);
    try {
      const results = await createVisualsFromTopicApi(text);
      setConcepts(results);
    } catch (err: any) {
      setError(err.message || 'Failed to generate visual concepts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSample = (sample: string) => {
    setTopic(sample);
    handleGenerate(sample);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-zinc-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Visual From Topic / Script</h2>
              <p className="text-xs text-zinc-400">
                Turn an abstract theme, narrative hook, or video script into cinematographic visual scenes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input area */}
        <div className="mt-5 space-y-3">
          <label className="text-xs font-semibold text-zinc-300 block">
            Enter Topic, Quote, or Script Hook:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
              placeholder='e.g., "Work hard and build your future."'
              className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={() => handleGenerate()}
              disabled={isLoading || !topic.trim()}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-amber-900/20 flex items-center gap-1.5 shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Directing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Concepts</span>
                </>
              )}
            </button>
          </div>

          {/* Quick inspiration chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-zinc-500 font-medium">Examples:</span>
            {SAMPLE_TOPICS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700/50 transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Generated concepts list */}
        <div className="mt-6 space-y-4 flex-1">
          {concepts.length > 0 ? (
            concepts.map((concept, index) => (
              <div
                key={concept.id || index}
                className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/90 hover:border-zinc-700 transition-all space-y-3 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[11px] font-bold flex items-center justify-center border border-indigo-500/30">
                        {index + 1}
                      </span>
                      <h3 className="font-semibold text-white text-sm tracking-wide">
                        {concept.title}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 pl-7">
                      {concept.summary}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {concept.suggestedStyle}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {concept.suggestedAspectRatio}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed font-sans">
                  {concept.prompt}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      onSelectConcept(concept, false);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    Edit In Workspace
                  </button>
                  <button
                    onClick={() => {
                      onSelectConcept(concept, true);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <span>Generate Concept</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            !isLoading && (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-zinc-800">
                <Lightbulb className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">
                  Type a topic or select one of the examples above to brainstorm 3 visual concepts.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
