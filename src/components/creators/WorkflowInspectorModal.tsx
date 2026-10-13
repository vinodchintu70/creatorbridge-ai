'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { PortfolioProject } from '@/types/creator';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const emptySubscribe = () => () => {};

export interface WorkflowInspectorModalProps {
  project: PortfolioProject | null;
  creatorName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function WorkflowInspectorModal({
  project,
  creatorName,
  isOpen,
  onClose,
}: WorkflowInspectorModalProps) {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll cleanly when modal is open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original || '';
      };
    }
  }, [isOpen]);

  if (!isClient || !isOpen) return null;

  if (!project) {
    return createPortal(
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Workflow Details Not Found"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-zinc-100 flex flex-col items-center gap-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-12 w-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-2xl">
            ⚙️
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-white">Workflow Not Found</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The requested workflow recipe details could not be loaded.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      </div>,
      document.body
    );
  }

  const workflow = project.workflow || {
    primaryModel: 'Not specified',
    prompt: 'No prompt details recorded.',
    negativePrompt: '',
    seed: 0,
    sampler: 'Default',
    steps: 0,
    cfgScale: 0,
    pipelineNodes: [],
    consistencyNotes: '',
    productionTechnique: 'Standard generative workflow',
  };
  const toolsUsed = Array.isArray(project.toolsUsed) ? project.toolsUsed : [];

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(workflow.prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workflow-inspector-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl shadow-purple-950/40 text-zinc-100 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-850 pb-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-purple-400">
                How This Project Was Made
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-400">Creator: {creatorName}</span>
              <Badge variant="default" className="text-[11px]">
                {project.commercialLicense}
              </Badge>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-750">
                Sample Project (Demo)
              </span>
            </div>
            <h2 id="workflow-inspector-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {project.title}
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              {project.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Close workflow inspector"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Human-readable Production Overview */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/30 via-zinc-900/60 to-indigo-950/20 border border-purple-900/40 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-400 inline-block animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-tight">Production Overview</h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
            {workflow.productionTechnique}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/80 text-xs">
            <span className="text-zinc-400 font-mono text-[11px]">Tools Used:</span>
            <div className="flex flex-wrap gap-1">
              {toolsUsed.map((tool) => (
                <span key={tool} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-xs font-medium">
                  {tool}
                </span>
              ))}
            </div>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 font-mono text-[11px]">Format: {project.aspectRatio} ({project.contentType})</span>
          </div>
        </div>

        {/* Creative Prompt Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-400 inline-block" />
                <span>Creative Prompt</span>
              </div>
              <span className="text-[11px] text-zinc-400 mt-0.5">
                The creative text instructions given to the AI model to describe scene style, lighting, and composition.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPrompt}
              className="text-xs h-7 py-0 px-2.5 shrink-0 hover:border-purple-500/50 hover:text-white"
            >
              {copiedPrompt ? 'Copied to Clipboard!' : 'Copy Prompt'}
            </Button>
          </div>
          <pre className="p-3.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
            {workflow.prompt}
          </pre>
        </div>

        {/* Negative Prompt (if available) */}
        {workflow.negativePrompt && (
          <div className="flex flex-col gap-1.5">
            <div className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />
              <span>What Was Excluded (Negative Constraints)</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Directives telling the AI to avoid visual artifacts, distortion, or unwanted traits.
            </p>
            <pre className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-xs text-zinc-400 font-mono whitespace-pre-wrap break-words leading-relaxed">
              {workflow.negativePrompt}
            </pre>
          </div>
        )}

        {/* Consistency Proof Notes */}
        {workflow.consistencyNotes && (
          <div className="p-3.5 rounded-lg bg-purple-950/20 border border-purple-900/40 flex flex-col gap-1">
            <div className="text-xs font-semibold text-purple-300">
              Brand & Character Consistency Controls:
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {workflow.consistencyNotes}
            </p>
          </div>
        )}

        {/* Advanced Technical Details Accordion */}
        <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/40">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-850/50 transition-colors focus:outline-none"
            aria-expanded={showTechnicalDetails}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
              <span className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <span>Technical Details</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-750">
                  Advanced
                </span>
              </span>
              <span className="text-xs text-zinc-400">
                (Seeds, Samplers, CFG & Pipeline Nodes)
              </span>
            </div>
            <span className="text-xs font-medium text-purple-400">
              {showTechnicalDetails ? 'Hide Details ▲' : 'Show Details ▼'}
            </span>
          </button>

          {showTechnicalDetails && (
            <div className="p-4 pt-2 border-t border-zinc-800/80 flex flex-col gap-4">
              {/* Beginner-annotated parameter grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-850 flex flex-col gap-1">
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Primary Model</div>
                  <div className="text-xs font-semibold text-zinc-200 break-words" title={workflow.primaryModel}>
                    {workflow.primaryModel}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-normal">
                    The underlying neural network checkpoint and custom LoRA weights used for rendering.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-850 flex flex-col gap-1">
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Seed Value</div>
                  <div className="text-xs font-semibold font-mono text-purple-300">
                    {workflow.seed}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-normal">
                    The random noise starting point used to replicate identical generation results.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-850 flex flex-col gap-1">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase">Sampler & Steps</div>
                  <div className="text-xs font-semibold text-zinc-200">
                    {workflow.sampler} • {workflow.steps} steps
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-normal">
                    The mathematical algorithm and count of iterative refinement passes used.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-850 flex flex-col gap-1">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase">CFG Scale (Guidance)</div>
                  <div className="text-xs font-semibold text-zinc-200">
                    {workflow.cfgScale}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-normal">
                    How strictly the AI adhered to the prompt vs exploring stylistic variation.
                  </p>
                </div>
              </div>

              {/* Pipeline Nodes */}
              {workflow.pipelineNodes && workflow.pipelineNodes.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                    <span>Pipeline & Post-Processing Nodes (ComfyUI / VFX)</span>
                    <span className="text-[10px] text-zinc-400 font-mono">Specialized Modules</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Custom modular nodes used for depth mapping, motion control, facial detail, and upscaling:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {workflow.pipelineNodes.map((node) => (
                      <span
                        key={node}
                        className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-750 text-xs text-cyan-300 font-mono"
                      >
                        {node}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Truthful Notice */}
              <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-850 text-[11px] text-zinc-400 flex items-center gap-2">
                <span>⚡</span>
                <span>
                  Simulated demonstration specimen. Parameters and nodes showcase workflow reproducibility for portfolio review.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-850 mt-1">
          <div className="text-xs text-zinc-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">Esc</kbd> to close
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

