'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BriefFormData } from '@/types/brief';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { isSupabaseConfigured } from '@/lib/supabase';
import { formatBudgetRange } from '@/utils/formatCurrency';

export interface BriefPublishSuccessModalProps {
  brief: BriefFormData | null;
  isOpen: boolean;
  onClose: () => void;
  onResetForm: () => void;
  invitedCreatorName?: string;
}

export function BriefPublishSuccessModal({
  brief,
  isOpen,
  onClose,
  onResetForm,
  invitedCreatorName,
}: BriefPublishSuccessModalProps) {
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen || !brief) return null;

  const handleCopyId = () => {
    if (brief.id) {
      navigator.clipboard.writeText(brief.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-success-title"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl text-zinc-100 flex flex-col items-center text-center gap-6">
        {/* Success Icon */}
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl">
          ✓
        </div>

        <div className="flex flex-col gap-2">
          <Badge variant={brief.savedRemotely ? 'verified' : 'default'} className="self-center text-xs">
            {brief.savedRemotely ? '✓ Live on Supabase Database' : 'Saved to Local Browser Storage'}
          </Badge>
          <h2 id="publish-success-title" className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Campaign Brief Published
          </h2>
          <p className="text-sm text-zinc-400 max-w-md">
            Your campaign brief <span className="text-white font-medium">&quot;{brief.title}&quot;</span> is now saved and ready to share with AI creators.
          </p>
        </div>

        {/* Invited Creator Collaboration Banner */}
        {invitedCreatorName && (
          <div className="w-full p-3.5 rounded-xl bg-purple-950/40 border border-purple-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-purple-400 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-white">Targeted Creator Selected</span>
                <p className="text-[11px] text-zinc-300">
                  This brief is targeted to <strong className="text-white">{invitedCreatorName}</strong>.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50 shrink-0">
              Targeted Creator
            </span>
          </div>
        )}

        {/* Brief Reference Card */}
        <div className="w-full p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-left flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Brief Identifier</span>
            <button
              type="button"
              onClick={handleCopyId}
              className="text-xs font-mono text-purple-400 hover:text-purple-300 cursor-pointer"
            >
              {copiedId ? 'Copied!' : 'Copy ID'}
            </button>
          </div>
          <div className="font-mono text-xs bg-zinc-950 p-2.5 rounded border border-zinc-850 text-purple-300 break-all">
            {brief.id || 'brief-live-demo'}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-850 text-xs text-zinc-300">
            <div>
              <span className="text-zinc-500">Deliverables:</span> {brief.deliverablesCount} Asset(s)
            </div>
            <div>
              <span className="text-zinc-500">Usage Rights:</span> {brief.commercialUsage}
            </div>
            <div>
              <span className="text-zinc-500">Budget:</span> {formatBudgetRange(brief.budgetMin, brief.budgetMax, brief.currency || 'INR')}
            </div>
            <div>
              <span className="text-zinc-500">Deadline:</span> {brief.deadline}
            </div>
          </div>
        </div>

        {/* Persistence Notice */}
        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-850 text-[11px] text-zinc-400 w-full text-left">
          {brief.savedRemotely ? (
            <span>
              <strong className="text-emerald-400">Database Synchronized:</strong> This brief is securely stored in your remote Supabase PostgreSQL database (<code className="text-zinc-300">campaign_briefs</code>) and cached locally.
            </span>
          ) : (
            <span>
              <strong className="text-amber-400">Local Browser Storage:</strong> This brief is saved in your browser&apos;s local storage. {isSupabaseConfigured() ? 'Cloud database sync was not confirmed or encountered a network issue.' : 'Connect Supabase credentials in .env.local for cloud database sync.'}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Link href="/briefs" className="w-full sm:flex-1">
            <Button variant="primary" size="md" className="w-full">
              View in Campaigns Hub →
            </Button>
          </Link>

          <Link href="/creators" className="w-full sm:flex-1">
            <Button variant="outline" size="md" className="w-full">
              Find Matching Creators
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              onResetForm();
              onClose();
            }}
            className="w-full sm:w-auto text-xs text-zinc-400 hover:text-white"
          >
            Create Another Brief
          </Button>
        </div>
      </div>
    </div>
  );
}
