'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  BriefContentType,
  BriefDistributionChannel,
  BriefCommercialUsage,
} from '@/types/brief';
import { AITool } from '@/types/creator';

export interface GeneratedBriefSuggestion {
  title: string;
  brandName: string | null;
  objective: string;
  targetAudience: string;
  channels: BriefDistributionChannel[];
  contentType: BriefContentType;
  creativeStyle: string;
  aspectRatio: string;
  duration: string;
  deliverablesCount: number;
  preferredTools: AITool[];
  requiredSkills: string[];
  commercialUsage: BriefCommercialUsage | null;
  budgetMin: number | null;
  budgetMax: number | null;
  deadline: string | null;
  creativeConstraints: string;
  unansweredFields: string[];
}

export interface AIBriefCopilotProps {
  onApplySuggestions: (suggestion: GeneratedBriefSuggestion) => void;
  disabled?: boolean;
}

const PROMPT_PRESETS = [
  {
    label: '⚡ Cyberpunk Energy Reel',
    prompt:
      'High-velocity 9:16 vertical video reel for a neon cyberpunk energy drink. Volumetric lighting, glitch cuts, dynamic camera moves, vibrant electric violet aesthetic for Gen Z on TikTok.',
  },
  {
    label: '🪔 Festive Luxury Film (₹2,50,000)',
    prompt:
      'Royal heritage couture commercial for festive season with gold brocade textile simulations, floating floral particles, slow-motion Kathak dance movements, and royal palace set lighting for YouTube & Instagram. Budget: ₹2,50,000 INR.',
  },
  {
    label: '💎 Luxury Timepiece Launch',
    prompt:
      'Cinematic 4K launch campaign for a Swiss luxury mechanical watch. Macro lens mechanical escapement shots, dramatic studio chiaroscuro lighting, and orchestral sound design for YouTube.',
  },
  {
    label: '🛸 Sci-Fi Hypercar 3D VFX',
    prompt:
      'Photorealistic 3D product VFX reel showcasing a futuristic electric hypercar speeding across reflective salt flats at dusk. Anamorphic lens flares, unreal engine fidelity.',
  },
];

const GENERATION_STAGES = [
  'Understanding campaign vision & style direction...',
  'Structuring deliverables, channels & formats...',
  'Synthesizing creative parameters & tool recipes...',
];

/**
 * Animated AI Orb Component
 * Features layered gradients, soft glow, glass specular highlight,
 * idle breathing, and active orbital ring rotation during generation.
 */
function AIOrb({
  isGenerating,
  hasSuccess,
  hasError,
}: {
  isGenerating: boolean;
  hasSuccess: boolean;
  hasError: boolean;
}) {
  return (
    <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
      {/* Outer ambient glow */}
      <div
        className={`absolute inset-[-4px] rounded-full blur-md transition-all duration-700 pointer-events-none ${
          isGenerating
            ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 opacity-80 animate-orb-pulse-glow'
            : hasSuccess
            ? 'bg-gradient-to-r from-emerald-500 to-purple-500 opacity-60'
            : hasError
            ? 'bg-gradient-to-r from-purple-600 to-amber-500 opacity-40'
            : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 opacity-40 animate-orb-pulse-glow'
        }`}
      />

      {/* Rotating orbit ring during active generation */}
      {isGenerating && (
        <div
          className="absolute inset-[-2px] rounded-full p-[1.5px] bg-gradient-to-tr from-purple-400 via-pink-400 to-indigo-400 animate-orb-spin opacity-90 pointer-events-none"
        />
      )}

      {/* Static subtle ring in idle */}
      {!isGenerating && (
        <div className="absolute inset-[-1px] rounded-full border border-purple-500/30 opacity-70 pointer-events-none" />
      )}

      {/* Inner Orb Core */}
      <div
        className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg transition-transform duration-500 ${
          isGenerating ? 'scale-105' : 'animate-orb-breathe'
        }`}
        style={{
          background: isGenerating
            ? 'radial-gradient(circle at 35% 35%, #f3e8ff 0%, #c084fc 35%, #7e22ce 70%, #3b0764 100%)'
            : hasSuccess
            ? 'radial-gradient(circle at 35% 35%, #ecfdf5 0%, #34d399 35%, #059669 70%, #064e3b 100%)'
            : 'radial-gradient(circle at 35% 35%, #faf5ff 0%, #a855f7 35%, #6b21a8 70%, #2e1065 100%)',
          boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.6), 0 4px 14px rgba(168, 85, 247, 0.35)',
        }}
      >
        {/* Specular glass reflection */}
        <div className="absolute top-1 left-2 w-3.5 h-2 rounded-full bg-white/40 blur-[0.5px] rotate-[-25deg] pointer-events-none" />

        {/* Central emblem */}
        <span className="relative text-white font-semibold text-xs sm:text-sm drop-shadow-sm select-none">
          {hasSuccess ? '✓' : isGenerating ? '✦' : '✨'}
        </span>
      </div>
    </div>
  );
}

export function AIBriefCopilot({ onApplySuggestions, disabled }: AIBriefCopilotProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [suggestion, setSuggestion] = useState<GeneratedBriefSuggestion | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Progressive stage timer during active generation
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setGenerationStage((prev) => (prev < GENERATION_STAGES.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Execute AI generation
  const handleGenerate = async () => {
    const textToSubmit = promptText.trim();
    if (textToSubmit.length < 5) {
      setErrorMessage('Please enter at least 5 characters describing your campaign concept.');
      return;
    }

    setGenerationStage(0);
    setIsLoading(true);
    setErrorMessage(null);
    setIsQuotaError(false);
    setIsServiceUnavailable(false);
    setShowTechnicalDetails(false);

    try {
      const res = await fetch('/api/ai/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSubmit }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 || data.isQuotaError) {
          setIsQuotaError(true);
        } else if (res.status === 503 || data.isServiceUnavailable) {
          setIsServiceUnavailable(true);
        }
        throw new Error(data.error || `Server responded with HTTP ${res.status}`);
      }

      if (!data.suggestion) {
        throw new Error('AI returned an empty response. Please try again.');
      }

      setSuggestion(data.suggestion as GeneratedBriefSuggestion);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate brief with AI.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Populate prompt from starter chip WITHOUT auto-submitting
  const handleSelectStarter = (starterPrompt: string) => {
    setPromptText(starterPrompt);
    setErrorMessage(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Apply suggestions to form and smoothly scroll down
  const handleApply = () => {
    if (!suggestion) return;
    onApplySuggestions(suggestion);
    // Smoothly scroll down to the manual builder
    const formSection = document.getElementById('brief-form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Discard and return to prompt input
  const handleDiscard = () => {
    setSuggestion(null);
    setErrorMessage(null);
  };

  return (
    <div className="w-full rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-950/25 via-zinc-950/80 to-zinc-950/95 backdrop-blur-xl p-5 sm:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3.5">
          <AIOrb
            isGenerating={isLoading}
            hasSuccess={Boolean(suggestion)}
            hasError={Boolean(errorMessage)}
          />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                AI Brief Copilot
              </h2>
              <Badge variant="accent" className="text-[10px] py-0 px-2 font-mono">
                Gemini 3.7 Flash
              </Badge>
            </div>
            <p className="text-xs text-zinc-400">
              Turn your campaign idea into a structured creative brief.
            </p>
          </div>
        </div>

        {/* Discreet Minimize/Expand Control */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse AI Brief Copilot' : 'Expand AI Brief Copilot'}
        >
          <span>{isOpen ? 'Collapse' : 'Expand'}</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Collapsible Body */}
      {isOpen && (
        <div className="mt-5 flex flex-col gap-5 relative z-10 animate-in fade-in duration-200">
          {!suggestion ? (
            /* Input & Prompt Generation Stage */
            <div className="flex flex-col gap-4">
              {/* Campaign Vision Description Input */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <label htmlFor="ai-copilot-input" className="cursor-pointer">
                    Campaign Vision & Requirements
                  </label>
                  <span className="text-[11px] font-mono text-zinc-500 font-normal">
                    {promptText.length} / 2500
                  </span>
                </div>

                <textarea
                  ref={textareaRef}
                  id="ai-copilot-input"
                  rows={3}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  disabled={isLoading || disabled}
                  placeholder="Describe what you want to create (e.g. A 30s cinematic luxury fragrance commercial with macro fluid caustics for YouTube and Instagram pre-rolls)..."
                  className="w-full rounded-xl bg-zinc-950/80 border border-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-y min-h-[105px] leading-relaxed"
                />
              </div>

              {/* Starter Ideas Prompt Chips */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs">
                <span className="text-zinc-500 shrink-0 font-medium">Starter Ideas:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PROMPT_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      disabled={isLoading || disabled}
                      onClick={() => handleSelectStarter(preset.prompt)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800/90 hover:border-purple-500/50 hover:bg-zinc-850 text-zinc-300 hover:text-white text-[11px] transition-all cursor-pointer font-medium"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generation State Shimmer and Stage Indicator */}
              {isLoading && (
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/30 flex flex-col gap-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                      <span className="font-semibold text-purple-200">
                        {GENERATION_STAGES[generationStage]}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">Processing with Gemini</span>
                  </div>

                  {/* Subtle Shimmer Track */}
                  <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden relative">
                    <div className="h-full w-full rounded-full animate-shimmer-progress" />
                  </div>
                </div>
              )}

              {/* Compact, Human-Friendly Error & Quota Notification */}
              {errorMessage && !isLoading && (
                <div className="p-4 rounded-xl bg-purple-950/25 border border-purple-800/40 text-xs text-zinc-300 flex flex-col gap-3 backdrop-blur-md animate-in fade-in duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="h-6 w-6 rounded-lg bg-purple-500/15 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {isQuotaError ? '⏳' : isServiceUnavailable ? '⚡' : 'ℹ️'}
                      </span>
                      <div className="flex flex-col gap-1">
                        <strong className="text-white font-semibold">
                          {isQuotaError
                            ? 'AI Generation Temporarily at Capacity'
                            : isServiceUnavailable
                            ? 'AI Service Temporarily Busy'
                            : 'AI Brief Notice'}
                        </strong>
                        <p className="text-zinc-300 leading-relaxed text-xs">
                          {isQuotaError
                            ? 'The AI assistant has reached its current API usage limit. Your prompt above has been preserved, and you can continue creating your brief manually below.'
                            : isServiceUnavailable
                            ? 'The Gemini service is experiencing heavy traffic. Your prompt has been preserved. You can retry shortly or build your brief manually below.'
                            : errorMessage}
                        </p>
                      </div>
                    </div>

                    {!isQuotaError && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerate()}
                        className="shrink-0 text-xs border-purple-700/60 hover:bg-purple-900/30 text-purple-200"
                      >
                        Retry
                      </Button>
                    )}
                  </div>

                  {/* Smooth CTA & Technical Details Accordion */}
                  <div className="flex items-center justify-between pt-2 border-t border-purple-900/30 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const formSection = document.getElementById('brief-form-section');
                        if (formSection) {
                          formSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>Continue Building Manually Below</span>
                      <span>↓</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showTechnicalDetails ? 'Hide technical details' : 'Show technical details'}
                    </button>
                  </div>

                  {showTechnicalDetails && (
                    <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-850 font-mono text-[11px] text-zinc-400 break-all">
                      <span className="text-zinc-500">Diagnostic message:</span> {errorMessage}
                    </div>
                  )}
                </div>
              )}

              {/* Primary Action Button Bar */}
              <div className="flex items-center justify-between pt-1 flex-wrap gap-3">
                <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Unspecified budgets and deadlines are preserved as unanswered for user confirmation.</span>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleGenerate}
                  disabled={isLoading || promptText.trim().length < 5 || disabled}
                  aria-busy={isLoading}
                  className="w-full sm:w-auto relative overflow-hidden cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Generating Brief...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span>✨</span>
                      <span>Generate My Brief</span>
                    </span>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Review Generated Brief Draft Stage */
            <div className="flex flex-col gap-5 animate-in fade-in duration-200">
              <div className="p-5 rounded-xl bg-zinc-900/80 border border-purple-500/30 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      Structured Brief Draft Ready
                    </span>
                    <Badge variant="verified" className="text-[10px]">
                      AI Synthesized
                    </Badge>
                  </div>
                  <span className="text-xs text-purple-300 font-medium">
                    {suggestion.contentType}
                  </span>
                </div>

                {/* Extracted Specifications Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <span className="text-zinc-400 font-medium">Campaign Title</span>
                    <div className="font-semibold text-white text-sm bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-850">
                      {suggestion.title}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-400 font-medium">Brand / Client</span>
                    <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-850 text-zinc-200">
                      {suggestion.brandName || (
                        <span className="text-amber-400 italic">Unspecified in prompt (provide in form)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-400 font-medium">Deliverables & Format</span>
                    <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-850 text-zinc-200">
                      {suggestion.deliverablesCount} Asset(s) • {suggestion.aspectRatio.split(' ')[0]}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <span className="text-zinc-400 font-medium">Campaign Objective</span>
                    <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-850 text-zinc-300 leading-relaxed">
                      {suggestion.objective}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <span className="text-zinc-400 font-medium">Suggested Channels & Tools</span>
                    <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-850 flex items-center gap-1.5 flex-wrap text-[11px]">
                      {suggestion.channels.map((ch) => (
                        <span key={ch} className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium">
                          {ch}
                        </span>
                      ))}
                      <span className="text-zinc-600">•</span>
                      {suggestion.preferredTools.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-800/40 text-purple-300 font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Unanswered Fields Warning Banner */}
                {suggestion.unansweredFields && suggestion.unansweredFields.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-950/25 border border-amber-800/40 text-[11px] text-amber-300/90 flex items-start gap-2">
                    <span className="text-amber-400 text-xs">ℹ️</span>
                    <div>
                      <strong className="font-semibold text-amber-200">
                        Fields to Confirm in Form:
                      </strong>{' '}
                      {suggestion.unansweredFields
                        .map((f) => {
                          if (f === 'budget') return 'Budget Range';
                          if (f === 'deadline') return 'Deadline';
                          if (f === 'brandName') return 'Brand Name';
                          if (f === 'commercialUsage') return 'Licensing Terms';
                          return f;
                        })
                        .join(', ')}
                      . These parameters were not mentioned in your prompt and can be specified directly below.
                    </div>
                  </div>
                )}
              </div>

              {/* Actions: Apply or Edit */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDiscard}
                  className="w-full sm:w-auto text-xs"
                >
                  ← Edit Prompt
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleApply}
                  className="w-full sm:w-auto cursor-pointer"
                >
                  ✓ Apply to Brief Builder
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
