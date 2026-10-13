'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { invitationService } from '@/services/invitationService';
import { InvitationWithDetails, InvitationStatus } from '@/types/invitation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConversationThreadModal } from './ConversationThreadModal';

interface InvitationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export function InvitationsDrawer({
  isOpen,
  onClose,
  onOpenAuth,
}: InvitationsDrawerProps) {
  const { user, profile, isAuthenticated } = useAuth();
  const [invitations, setInvitations] = useState<InvitationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | InvitationStatus>('all');
  const [selectedConversation, setSelectedConversation] = useState<InvitationWithDetails | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const role = profile?.role;
  const isCreator = role === 'creator';
  const isBrand = role === 'brand';

  const loadInvitations = useCallback(async () => {
    if (!user) return;
    queueMicrotask(() => {
      setIsLoading(true);
      setActionError(null);
    });

    try {
      let items: InvitationWithDetails[] = [];
      if (isBrand) {
        items = await invitationService.getInvitationsForBrand(user.id);
      } else if (isCreator) {
        items = await invitationService.getInvitationsForCreator({
          creatorId: profile?.creatorId,
          creatorUserId: user.id,
        });
      } else {
        // Fallback: fetch both and combine
        const forBrand = await invitationService.getInvitationsForBrand(user.id);
        const forCreator = await invitationService.getInvitationsForCreator({
          creatorUserId: user.id,
        });
        items = [...forBrand, ...forCreator];
      }
      setInvitations(items);
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, isBrand, isCreator]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadInvitations();
    }
  }, [isOpen, isAuthenticated, loadInvitations]);

  if (!isOpen) return null;

  const handleRespond = async (invitationId: string, newStatus: 'accepted' | 'declined') => {
    if (!user) return;
    setRespondingId(invitationId);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await invitationService.respondToInvitation({
        invitationId,
        newStatus,
        actingUserId: user.id,
        actingCreatorId: profile?.creatorId,
      });

      if (!res.success) {
        setActionError(res.error || 'Failed to update invitation status.');
      } else {
        setActionSuccess(
          newStatus === 'accepted'
            ? 'Invitation accepted! Collaboration and persistent messaging unlocked.'
            : 'Invitation declined.'
        );
        await loadInvitations();
      }
    } finally {
      setRespondingId(null);
    }
  };

  const filteredItems = invitations.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  const pendingCount = invitations.filter((i) => i.status === 'pending').length;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invitations-drawer-title"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-lg h-full bg-zinc-950 border-l border-zinc-800 shadow-2xl text-zinc-100 flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-850 flex items-center justify-between bg-zinc-950 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-purple-950/60 border border-purple-800 flex items-center justify-center text-purple-300 font-bold text-sm">
                📬
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 id="invitations-drawer-title" className="text-lg font-bold text-white tracking-tight">
                    {isCreator ? 'Campaign Invitations' : 'Sent Invitations'}
                  </h2>
                  {pendingCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                      {pendingCount} Pending
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-400">
                  {isAuthenticated
                    ? `${profile?.displayName || user?.email} (${role?.toUpperCase()})`
                    : 'Not authenticated'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-zinc-850 transition-colors"
              aria-label="Close drawer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* If not authenticated: prompt */}
          {!isAuthenticated && (
            <div className="m-6 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col items-center text-center gap-3">
              <span className="text-2xl">🔒</span>
              <h3 className="text-base font-semibold text-white">Sign In Required</h3>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                Log in as a Brand or Creator to view invitations, accept briefs, and engage in persistent messaging.
              </p>
              {onOpenAuth && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="mt-2 text-xs"
                >
                  Open Sign In Modal
                </Button>
              )}
            </div>
          )}

          {/* Authenticated content */}
          {isAuthenticated && (
            <>
              {/* Filter Tabs */}
              <div className="px-5 pt-3 pb-2 border-b border-zinc-850 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  {(['all', 'pending', 'accepted', 'declined'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        statusFilter === s
                          ? 'bg-zinc-800 text-white font-semibold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={loadInvitations}
                  className="text-xs text-purple-400 hover:text-purple-300 font-mono"
                >
                  ↻ Refresh
                </button>
              </div>

              {/* Action feedback */}
              {actionError && (
                <div className="mx-5 mt-3 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div className="mx-5 mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs">
                  {actionSuccess}
                </div>
              )}

              {/* Invitations List */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5">
                {isLoading ? (
                  <div className="m-auto text-xs text-zinc-500">Loading invitations...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="m-auto text-center flex flex-col items-center gap-2 p-6">
                    <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl text-zinc-500">
                      📭
                    </div>
                    <span className="text-sm font-semibold text-zinc-300">No invitations found</span>
                    <p className="text-xs text-zinc-500 max-w-xs">
                      {isBrand
                        ? 'You haven’t sent any campaign invitations yet. Browse creators to send offers.'
                        : 'No campaign invitations match the selected filter.'}
                    </p>
                  </div>
                ) : (
                  filteredItems.map((inv) => {
                    const isPending = inv.status === 'pending';
                    const isAccepted = inv.status === 'accepted';

                    return (
                      <div
                        key={inv.id}
                        className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${
                          isAccepted
                            ? 'bg-purple-950/15 border-purple-900/40'
                            : isPending
                            ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                            : 'bg-zinc-950 border-zinc-850 opacity-70'
                        }`}
                      >
                        {/* Top Row: Title + Status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white leading-tight">
                              {inv.briefTitle}
                            </span>
                            <span className="text-xs text-zinc-400 mt-0.5">
                              {isCreator ? `From: ${inv.brandName}` : `Invited: ${inv.creatorName}`}
                            </span>
                          </div>

                          <Badge
                            variant={
                              isAccepted ? 'verified' : isPending ? 'accent' : 'default'
                            }
                            className="text-[10px] shrink-0"
                          >
                            {inv.status.toUpperCase()}
                          </Badge>
                        </div>

                        {/* Intro Message */}
                        {inv.introMessage && (
                          <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-850 text-xs text-zinc-300 leading-relaxed italic">
                            &quot;{inv.introMessage}&quot;
                          </div>
                        )}

                        {/* Footer: Timestamps & Action Buttons */}
                        <div className="pt-2 border-t border-zinc-850/80 flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-zinc-500">
                            {new Date(inv.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Creator action: Accept / Decline buttons if Pending */}
                            {isCreator && isPending && (
                              <>
                                <button
                                  type="button"
                                  disabled={respondingId === inv.id}
                                  onClick={() => handleRespond(inv.id, 'declined')}
                                  className="px-2.5 py-1 text-xs text-zinc-400 hover:text-red-300 hover:bg-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-800"
                                >
                                  Decline
                                </button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={respondingId === inv.id}
                                  onClick={() => handleRespond(inv.id, 'accepted')}
                                  className="text-xs h-7 py-0 px-3 bg-emerald-600 hover:bg-emerald-500 border-none"
                                >
                                  {respondingId === inv.id ? 'Accepting...' : 'Accept Offer ✓'}
                                </Button>
                              </>
                            )}

                            {/* Open Conversation for accepted invitations */}
                            {isAccepted && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedConversation(inv)}
                                className="text-xs h-7 py-0 px-2.5 text-purple-300 border-purple-800/60 hover:bg-purple-950/30"
                              >
                                💬 Open Chat ({inv.messages?.length || 0})
                              </Button>
                            )}

                            {/* View info for pending or declined */}
                            {!isAccepted && !isCreator && (
                              <span className="text-[11px] font-mono text-zinc-500">
                                {isPending ? 'Awaiting Creator Response' : 'Offer Declined'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Conversation Thread Modal */}
      {selectedConversation && (
        <ConversationThreadModal
          invitation={selectedConversation}
          isOpen={Boolean(selectedConversation)}
          onClose={() => setSelectedConversation(null)}
          onRefreshInvitation={loadInvitations}
        />
      )}
    </>
  );
}
