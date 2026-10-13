'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Creator } from '@/types/creator';
import { BriefFormData } from '@/types/brief';
import { briefService } from '@/services/briefService';
import { invitationService } from '@/services/invitationService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatBudgetRange } from '@/utils/formatCurrency';

interface InviteCreatorModalProps {
  creator: Creator | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenAuth?: () => void;
}

export function InviteCreatorModal({
  creator,
  isOpen,
  onClose,
  onSuccess,
  onOpenAuth,
}: InviteCreatorModalProps) {
  const { user, profile, isAuthenticated } = useAuth();

  const [briefs, setBriefs] = useState<BriefFormData[]>([]);
  const [selectedBriefId, setSelectedBriefId] = useState<string>('');
  const [introMessage, setIntroMessage] = useState('');
  const [isLoadingBriefs, setIsLoadingBriefs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load published briefs when modal opens
  useEffect(() => {
    if (isOpen) {
      let isMounted = true;
      queueMicrotask(() => {
        setIsLoadingBriefs(true);
        setErrorMessage(null);
        setSuccessMessage(null);
      });

      briefService
        .getPublishedBriefs()
        .then((items) => {
          if (isMounted) {
            setBriefs(items);
            if (items.length > 0) {
              setSelectedBriefId(items[0].id || '');
            }
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingBriefs(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen]);

  if (!isOpen || !creator) return null;

  const isBrand = isAuthenticated && profile?.role === 'brand';
  const selectedBrief = briefs.find((b) => b.id === selectedBriefId);

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isBrand) {
      setErrorMessage('Please authenticate as a Brand account to send campaign invitations.');
      return;
    }

    if (!selectedBriefId) {
      setErrorMessage('Please select a campaign brief to invite this creator to.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await invitationService.createInvitation({
        briefId: selectedBriefId,
        brandUserId: user.id,
        creatorId: creator.id,
        introMessage: introMessage.trim() || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to send invitation.');
      } else {
        setSuccessMessage(`Formal campaign invitation dispatched to ${creator.name}!`);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-7 shadow-2xl text-zinc-100 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-850">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider">
              Formal Campaign Invitation
            </span>
            <h2 id="invite-modal-title" className="text-xl font-bold text-white tracking-tight">
              Invite {creator.name}
            </h2>
            <span className="text-xs text-zinc-400">
              {creator.specialization} • {creator.rateEstimate}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Not authenticated or not Brand check */}
        {!isBrand && (
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 flex flex-col gap-3 text-xs">
            <div className="flex items-center gap-2 text-purple-300 font-semibold">
              <span>🔒 Brand Authentication Required</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              Campaign invitations are legally binding production offers backed by Supabase Auth and Row Level Security. You must be authenticated as a verified Brand Studio to dispatch invitations.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {onOpenAuth && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="text-xs"
                >
                  Sign In / Switch to Brand Studio
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Feedback messages */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs">
            {successMessage}
          </div>
        )}

        {isBrand && (
          <form onSubmit={handleSendInvitation} className="flex flex-col gap-4">
            {/* Campaign Brief Picker */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">
                  Select Campaign Brief
                </label>
                <Link
                  href={`/briefs/new?invitedCreatorId=${creator.id}`}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-mono"
                  onClick={onClose}
                >
                  + Create New Brief
                </Link>
              </div>

              {isLoadingBriefs ? (
                <div className="text-xs text-zinc-400 py-3">Loading your campaign briefs...</div>
              ) : briefs.length === 0 ? (
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex flex-col gap-2">
                  <span>No published campaign briefs found.</span>
                  <Link
                    href={`/briefs/new?invitedCreatorId=${creator.id}`}
                    onClick={onClose}
                    className="text-purple-400 underline"
                  >
                    Create your first campaign brief to invite {creator.name}
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedBriefId}
                  onChange={(e) => setSelectedBriefId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {briefs.map((b) => (
                    <option key={b.id || b.title} value={b.id || ''}>
                      {b.title} — {b.contentType} ({b.budgetMin ? formatBudgetRange(b.budgetMin, b.budgetMax, b.currency || 'INR') : 'Budget Flexible'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selected Brief Summary Card */}
            {selectedBrief && (
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{selectedBrief.title}</span>
                  <Badge variant="verified">Ready to Invite</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-1 border-t border-zinc-850">
                  <div>
                    <span className="text-zinc-500">Deliverables:</span> {selectedBrief.deliverablesCount} Asset(s)
                  </div>
                  <div>
                    <span className="text-zinc-500">Rights:</span> {selectedBrief.commercialUsage || 'Standard Commercial'}
                  </div>
                </div>
              </div>
            )}

            {/* Introductory Message */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">
                  Introductory Message (Optional)
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {introMessage.length}/2000
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={2000}
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                placeholder={`Hi ${creator.name}, we loved your portfolio and would like to collaborate on our upcoming campaign...`}
                className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-850">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSubmitting || briefs.length === 0}
              >
                {isSubmitting ? 'Dispatching Invitation...' : 'Send Official Invitation →'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
