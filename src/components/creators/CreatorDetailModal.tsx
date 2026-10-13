'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { Creator, PortfolioProject } from '@/types/creator';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getProvenanceDetails } from '@/utils/provenance';
import { InviteCreatorModal } from '@/components/invitations/InviteCreatorModal';
import { AuthModal } from '@/components/auth/AuthModal';

const emptySubscribe = () => () => {};

export interface CreatorDetailModalProps {
  creator: Creator | null;
  isOpen: boolean;
  onClose: () => void;
  onInspectWorkflow?: (project: PortfolioProject, creatorName: string) => void;
  isWorkflowInspectorOpen?: boolean;
}

export function CreatorDetailModal({
  creator,
  isOpen,
  onClose,
  onInspectWorkflow,
  isWorkflowInspectorOpen = false,
}: CreatorDetailModalProps) {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Reset nested modals when selected creator changes (React render-time state adjustment)
  const [prevCreatorId, setPrevCreatorId] = useState(creator?.id);
  if (creator?.id !== prevCreatorId) {
    setPrevCreatorId(creator?.id);
    setIsInviteModalOpen(false);
    setIsAuthModalOpen(false);
  }

  // Close on Escape key only if child modal is not currently open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        isOpen &&
        !isWorkflowInspectorOpen &&
        !isInviteModalOpen &&
        !isAuthModalOpen
      ) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isWorkflowInspectorOpen, isInviteModalOpen, isAuthModalOpen, onClose]);

  // Lock body scroll cleanly while modal is active
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

  if (!creator) {
    return createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Creator Profile Not Found"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md rounded-2xl border border-zinc-750 bg-zinc-900 p-6 text-center text-zinc-100 flex flex-col items-center gap-4 shadow-2xl shadow-black/80"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-12 w-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-2xl">
            🔍
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-white">Creator Not Found</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The requested creator profile could not be loaded or is no longer available in the catalog.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Back to Directory
          </Button>
        </div>
      </div>,
      document.body
    );
  }

  const portfolioList = Array.isArray(creator.portfolio) ? creator.portfolio : [];
  const primaryToolsList = Array.isArray(creator.primaryTools) ? creator.primaryTools : [];
  const skillsList = Array.isArray(creator.skills) ? creator.skills : [];
  const provenance = getProvenanceDetails(creator.verification);

  const modalElement = (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="creator-detail-name"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-4xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-zinc-750 bg-zinc-900 p-5 sm:p-7 md:p-8 shadow-2xl shadow-black/80 text-zinc-100 flex flex-col gap-6 sm:gap-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Profile Section */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-zinc-800">
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900 shrink-0">
                <Image
                  src={creator.avatarUrl}
                  alt={creator.name}
                  fill
                  sizes="(max-width: 640px) 64px, 80px"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 id="creator-detail-name" className="text-2xl font-bold text-white tracking-tight">
                    {creator.name}
                  </h2>
                  <span className="text-sm font-mono text-zinc-400">{creator.handle}</span>

                  {/* Provenance Badge */}
                  <Badge variant={provenance.badgeVariant} className="text-xs font-mono">
                    {provenance.badgeIcon} {provenance.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                  <span className="text-purple-400 font-medium">{creator.specialization}</span>
                  <span>•</span>
                  <span>{creator.location}</span>
                  <span>•</span>
                  <span className="text-emerald-400">{creator.availability}</span>
                  <span>•</span>
                  <span className="font-mono text-zinc-300">
                    {creator.rateEstimate
                      ? creator.rateEstimate.startsWith('Est.')
                        ? creator.rateEstimate
                        : `Est. ${creator.rateEstimate}`
                      : 'Rate on Request'}
                  </span>
                </div>

                <p className="text-sm text-zinc-300 mt-2 max-w-xl leading-relaxed">
                  {creator.bio}
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end gap-2.5 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors self-end shrink-0"
                aria-label="Close creator details"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="w-full sm:w-auto text-xs"
                >
                  ✉ Send Invitation
                </Button>
                <Link href={`/briefs/new?invitedCreatorId=${creator.id}`} className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs">
                    + New Brief
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Provenance & Evidence Drawer */}
          <div
            className={`p-4 rounded-xl border text-xs flex flex-col gap-2.5 ${
              provenance.tier === 'verified'
                ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                : provenance.tier === 'demo_evidence'
                ? 'bg-purple-950/20 border-purple-900/40 text-purple-300'
                : provenance.tier === 'external_linked'
                ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                : 'bg-amber-950/20 border-amber-900/40 text-amber-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs">
                  Evidence Status: {provenance.label}
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-300 text-xs font-medium">{provenance.shortDescription}</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium shrink-0">
                Usage Rights: {creator.commercialSuitability}
              </span>
            </div>

            <p className="text-zinc-300 text-xs leading-relaxed">
              {provenance.explanation}
            </p>

            {creator.verification.evidenceDetail && (
              <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 font-mono flex items-center gap-2">
                <span className="text-zinc-500">Record:</span>
                <span className="text-zinc-300">{creator.verification.evidenceDetail}</span>
              </div>
            )}

            {/* Truthful guidance on evidence classification */}
            <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed">
              {provenance.tier === 'demo_evidence' && (
                <span>
                  ⚡ <strong className="text-zinc-300">Demonstration Sample:</strong> This profile includes simulated workflow pipelines and sample outputs created to showcase technique and parameter repeatability.
                </span>
              )}
              {provenance.tier === 'self_reported' && (
                <span>
                  ⚠ <strong className="text-zinc-300">Self-Reported Information:</strong> Experience, rates, and skills are provided directly by the creator and have not been independently audited.
                </span>
              )}
              {provenance.tier === 'external_linked' && (
                <span>
                  🔗 <strong className="text-zinc-300">External Reference:</strong> Creator provided external portfolio links; verify credentials directly before commercial engagement.
                </span>
              )}
              {provenance.tier === 'verified' && (
                <span>
                  ✓ <strong className="text-emerald-400">Independently Verified:</strong> Backed by documented proof and verification checks.
                </span>
              )}
            </div>
          </div>

          {/* Usage Rights Plain-English Guidance */}
          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-850 flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-2 font-semibold text-zinc-200">
              <span className="text-purple-400 text-xs font-semibold">Usage Rights:</span>
              <span>{creator.commercialSuitability}</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              {creator.commercialSuitability === 'Full IP Buyout' &&
                'Full Commercial Ownership (Buyout): Creator transfers full intellectual property ownership upon completed delivery.'}
              {creator.commercialSuitability === 'Exclusive Commercial' &&
                'Exclusive Commercial License: Brand receives exclusive commercial usage for agreed campaign deliverables.'}
              {creator.commercialSuitability === 'Standard Agency' &&
                'Standard Agency License: Licensed for brand campaigns and client marketing under standard agency terms.'}
              {creator.commercialSuitability === 'Restricted Editorial' &&
                'Editorial Use Only: Restricted to editorial or non-commercial use.'}
              {' '}Final usage rights and deliverables are agreed upon in your written project brief.
            </p>
          </div>

          {/* Tools & Skills Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-850 flex flex-col gap-2">
              <span className="text-xs font-semibold text-zinc-300">
                Tools & Software
              </span>
              <div className="flex flex-wrap gap-1.5">
                {primaryToolsList.length > 0 ? (
                  primaryToolsList.map((tool) => (
                    <Badge key={tool} variant="default" className="text-xs font-medium">
                      {tool}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">No tools specified</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-850 flex flex-col gap-2">
              <span className="text-xs font-semibold text-zinc-300">
                Core Skills & Techniques
              </span>
              <div className="flex flex-wrap gap-1.5">
                {skillsList.length > 0 ? (
                  skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-750 text-xs font-medium text-zinc-200"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">No skills listed</span>
                )}
              </div>
            </div>
          </div>

          {/* Portfolio Projects Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Portfolio & Sample Projects</h3>
                <p className="text-xs text-zinc-400">
                  Explore sample projects to see how each piece was made, from prompt parameters to final output.
                </p>
              </div>
              <span className="text-xs text-purple-400 font-medium">
                {portfolioList.length} Sample {portfolioList.length === 1 ? 'Project' : 'Projects'}
              </span>
            </div>

            {portfolioList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {portfolioList.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden">
                      <Image
                        src={project.thumbnailUrl || creator.avatarUrl}
                        alt={project.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] text-white font-medium">
                          {project.contentType || 'Video'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] text-purple-300 border border-purple-500/30 font-medium">
                          {project.aspectRatio || '16:9 Landscape'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-white tracking-tight line-clamp-1">
                          {project.title}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                        <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[140px]" title={project.workflow?.primaryModel || 'AI Model'}>
                          {project.workflow?.primaryModel || 'AI Model'}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onInspectWorkflow?.(project, creator.name)}
                          className="text-xs h-7 py-0 px-2.5 hover:border-purple-500/50 hover:text-white"
                        >
                          How It Was Made →
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center flex flex-col items-center gap-2">
                <span className="text-2xl">📁</span>
                <h4 className="text-sm font-semibold text-zinc-300">No Public Specimen Projects Yet</h4>
                <p className="text-xs text-zinc-500 max-w-sm">
                  This creator has not published public production recipes yet. You can invite them directly to discuss requirements and sample work for your brief.
                </p>
              </div>
            )}
          </div>

          {/* Footer Close */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-850">
            <span className="text-xs text-zinc-400">
              Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">Esc</kbd> to exit
            </span>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Invite Creator Modal */}
      <InviteCreatorModal
        creator={creator}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );

  return createPortal(modalElement, document.body);
}

