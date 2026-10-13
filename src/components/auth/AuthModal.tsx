'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UserRole } from '@/types/invitation';
import { TEST_ACCOUNTS } from '@/services/authService';

const emptySubscribe = () => () => {};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const {
    user,
    profile,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    loginAsTestAccount,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('brand');
  const [brandName, setBrandName] = useState('Lumina Labs');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync mode whenever opened with initialMode
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialMode]);

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

  // Lock body scroll cleanly while open
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to sign in.');
        } else {
          setSuccessMessage('Successfully signed in!');
          setTimeout(onClose, 800);
        }
      } else {
        const res = await signUp({
          email,
          password,
          role,
          displayName: displayName || (role === 'brand' ? brandName : 'Creator'),
          creatorId: undefined, // Public signup cannot claim catalog creator IDs
          brandName: role === 'brand' ? brandName : undefined,
        });
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to register account.');
        } else {
          setSuccessMessage('Account registered and profile created!');
          setTimeout(onClose, 800);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestLogin = async (type: 'brand' | 'creatorElena' | 'creatorKai') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const res = await loginAsTestAccount(type);
      if (!res.success) {
        setErrorMessage(res.error || 'Test account login failed.');
      } else {
        setSuccessMessage(`Signed in as ${TEST_ACCOUNTS[type].displayName}!`);
        setTimeout(onClose, 700);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-7 shadow-2xl text-zinc-100 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              CB
            </div>
            <h2 id="auth-modal-title" className="text-lg font-bold text-white tracking-tight">
              {isAuthenticated ? 'Authenticated Account' : mode === 'signin' ? 'Sign In to CreatorBridge' : 'Create Account'}
            </h2>
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

        {/* If Authenticated: Active Profile Details */}
        {isAuthenticated && user && (
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-mono">Current Session</span>
              <Badge variant="verified">
                {profile?.role === 'brand' ? 'Brand Studio' : 'Creator'}
              </Badge>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white text-base">
                {profile?.displayName || user.email}
              </span>
              <span className="text-xs text-zinc-400 font-mono">{user.email}</span>
              {profile?.creatorId && (
                <span className="text-xs text-purple-400 mt-1 font-mono">
                  Linked Creator ID: {profile.creatorId}
                </span>
              )}
              {profile?.brandName && (
                <span className="text-xs text-indigo-400 mt-1">
                  Brand: {profile.brandName}
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await signOut();
                  setSuccessMessage('Signed out.');
                }}
                className="text-xs text-zinc-300 hover:text-white"
              >
                Sign Out
              </Button>
            </div>
          </div>
        )}

        {/* Quick Test Accounts Switcher */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Quick Test Sessions (Phase 6B)
            </span>
            <span className="text-[10px] text-purple-400 font-mono">Real Supabase Auth</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleTestLogin('brand')}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500 hover:bg-zinc-850 text-left transition-colors flex flex-col gap-0.5 cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Brand Studio</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                  Brand
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 truncate">Lumina Labs</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleTestLogin('creatorElena')}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500 hover:bg-zinc-850 text-left transition-colors flex flex-col gap-0.5 cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Elena Rostova</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                  Creator
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 truncate">creator-1</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleTestLogin('creatorKai')}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500 hover:bg-zinc-850 text-left transition-colors flex flex-col gap-0.5 cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Kai Takahashi</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                  Creator
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 truncate">creator-2</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-zinc-850" />
          <span className="absolute bg-zinc-950 px-3 text-[11px] text-zinc-500 uppercase tracking-wider font-mono">
            Or custom credentials
          </span>
        </div>

        {/* Feedback message */}
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

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex rounded-lg bg-zinc-900 p-1 border border-zinc-800">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === 'signin' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === 'signup' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {mode === 'signup' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-400">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Elena Rostova or Studio Name"
                  className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-400">Platform Role</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('brand')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      role === 'brand'
                        ? 'bg-purple-950/40 border-purple-500 text-purple-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    🏢 Brand
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('creator')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      role === 'creator'
                        ? 'bg-purple-950/40 border-purple-500 text-purple-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    🎨 Creator
                  </button>
                </div>
              </div>

              {role === 'creator' && (
                <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                  <span className="font-semibold text-zinc-300 block mb-0.5">Independent Creator Account</span>
                  Registers a new creator identity on CreatorBridge AI. To link a pre-existing catalog portfolio, accounts must be verified through the administrative onboarding procedure.
                </div>
              )}

              {role === 'brand' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-400">Brand Organization</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Brand or Studio Name"
                    className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}
            </>
          )}

          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2"
          >
            {isSubmitting ? 'Authenticating...' : mode === 'signin' ? 'Sign In' : 'Register Account'}
          </Button>
        </form>
      </div>
    </div>,
    document.body
  );
}

