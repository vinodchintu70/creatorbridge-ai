'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { InvitationWithDetails, InvitationMessage } from '@/types/invitation';
import { invitationService } from '@/services/invitationService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ConversationThreadModalProps {
  invitation: InvitationWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onRefreshInvitation?: () => void;
}

export function ConversationThreadModal({
  invitation,
  isOpen,
  onClose,
  onRefreshInvitation,
}: ConversationThreadModalProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<InvitationMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAccepted = invitation?.status === 'accepted';
  const currentRole = profile?.role || (invitation?.brandUserId === user?.id ? 'brand' : 'creator');

  // Load messages
  useEffect(() => {
    if (isOpen && invitation) {
      let isMounted = true;
      queueMicrotask(() => {
        setIsLoading(true);
        setErrorMessage(null);
      });

      invitationService
        .getMessages(invitation.id)
        .then((items) => {
          if (isMounted) setMessages(items);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, invitation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !invitation) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!inputContent.trim()) return;

    if (!isAccepted) {
      setErrorMessage('Messaging is locked until the creator accepts the invitation.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const res = await invitationService.sendMessage({
        invitationId: invitation.id,
        senderUserId: user.id,
        senderRole: currentRole,
        content: inputContent.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to send message.');
      } else if (res.message) {
        setMessages((prev) => [...prev, res.message!]);
        setInputContent('');
        if (onRefreshInvitation) onRefreshInvitation();
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conversation-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl h-[85vh] max-h-[720px] rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl text-zinc-100 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between bg-zinc-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-950/60 border border-purple-850 flex items-center justify-center text-lg">
              💬
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="conversation-modal-title" className="text-base font-bold text-white tracking-tight">
                  {invitation.briefTitle}
                </h2>
                <Badge
                  variant={
                    invitation.status === 'accepted'
                      ? 'verified'
                      : invitation.status === 'pending'
                      ? 'accent'
                      : 'default'
                  }
                  className="text-[10px]"
                >
                  {invitation.status.toUpperCase()}
                </Badge>
              </div>
              <span className="text-xs text-zinc-400">
                {invitation.brandName} ↔ {invitation.creatorName}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-zinc-850 transition-colors"
            aria-label="Close conversation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lock Warning if status is not accepted */}
        {!isAccepted && (
          <div className="px-5 py-3 bg-amber-950/30 border-b border-amber-900/40 text-amber-300 text-xs flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span>
                <strong>Messaging Locked:</strong> This invitation is currently{' '}
                <span className="font-semibold underline uppercase">{invitation.status}</span>. Direct messaging unlocks automatically once the creator accepts.
              </span>
            </div>
          </div>
        )}

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3 bg-zinc-950/60">
          {invitation.introMessage && (
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 flex flex-col gap-1 shrink-0">
              <span className="text-[10px] font-mono uppercase text-purple-400 font-semibold">
                Invitation Note from {invitation.brandName}
              </span>
              <p className="italic leading-relaxed text-zinc-300">&quot;{invitation.introMessage}&quot;</p>
            </div>
          )}

          {isLoading ? (
            <div className="m-auto text-xs text-zinc-500">Loading conversation history...</div>
          ) : messages.length === 0 ? (
            <div className="m-auto text-center flex flex-col items-center gap-2 p-6">
              <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm text-zinc-500">
                ✉
              </div>
              <span className="text-xs text-zinc-400">No messages yet in this collaboration.</span>
              {isAccepted && (
                <span className="text-[11px] text-zinc-500">
                  Say hello or align on delivery milestones below.
                </span>
              )}
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderUserId === user?.id;
              const isSenderBrand = msg.senderRole === 'brand';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                    isMe ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-zinc-500">
                    <span className="font-medium text-zinc-400">
                      {isMe
                        ? 'You'
                        : isSenderBrand
                        ? invitation.brandName
                        : invitation.creatorName}
                    </span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase font-mono">
                      {msg.senderRole}
                    </span>
                    <span>•</span>
                    <span className="text-[10px] font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed break-words whitespace-pre-wrap ${
                      isMe
                        ? 'bg-purple-600 text-white rounded-tr-none shadow-md shadow-purple-950/40'
                        : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-zinc-850 bg-zinc-950 shrink-0">
          {errorMessage && (
            <div className="mb-2 p-2 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <textarea
              rows={2}
              maxLength={3000}
              disabled={!isAccepted || isSending}
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder={
                isAccepted
                  ? 'Type your message (Enter to send, Shift+Enter for newline)...'
                  : 'Messaging is locked until the creator accepts the invitation.'
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              className="flex-1 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={!isAccepted || isSending || !inputContent.trim()}
              className="h-10 px-4 shrink-0"
            >
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </form>

          <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-500 font-mono">
            <span>Locked strictly to authenticated participants</span>
            <span>{inputContent.length}/3000</span>
          </div>
        </div>
      </div>
    </div>
  );
}
