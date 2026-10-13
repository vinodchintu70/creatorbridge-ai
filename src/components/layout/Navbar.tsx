'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { NavItem } from '@/types/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { InvitationsDrawer } from '@/components/invitations/InvitationsDrawer';
import { invitationService } from '@/services/invitationService';

const NAV_ITEMS: NavItem[] = [
  { label: 'Explore Creators', href: '/creators' },
  { label: 'Campaigns', href: '/briefs' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Create a Brief', href: '/briefs/new' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [invitationsDrawerOpen, setInvitationsDrawerOpen] = useState(false);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  const { user, profile, isAuthenticated } = useAuth();

  // Refresh pending count
  useEffect(() => {
    let isMounted = true;
    async function checkPending() {
      if (!user) {
        setPendingInvitationsCount(0);
        return;
      }
      try {
        if (profile?.role === 'creator') {
          const invs = await invitationService.getInvitationsForCreator({
            creatorId: profile?.creatorId,
            creatorUserId: user.id,
          });
          if (isMounted) {
            setPendingInvitationsCount(invs.filter((i) => i.status === 'pending').length);
          }
        } else if (profile?.role === 'brand') {
          const invs = await invitationService.getInvitationsForBrand(user.id);
          if (isMounted) {
            setPendingInvitationsCount(invs.filter((i) => i.status === 'pending').length);
          }
        }
      } catch {
        // silent
      }
    }

    if (isAuthenticated) {
      checkPending();
      const interval = setInterval(checkPending, 8000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [user, profile, isAuthenticated]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#0c0e14]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg py-1 px-1.5 -ml-1.5"
              aria-label="CreatorBridge AI Home"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white font-bold text-base shadow-sm shadow-purple-500/25">
                CB
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-zinc-100 tracking-tight text-base leading-none">
                  CreatorBridge<span className="text-purple-400">.ai</span>
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">
                  AI Creator Marketplace
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav
              aria-label="Primary Navigation"
              className="hidden md:flex items-center gap-1 text-sm font-medium"
            >
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-zinc-900/80 rounded-lg transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Action CTAs */}
            <div className="hidden sm:flex items-center gap-2.5">
              {/* Invitations Drawer Trigger Button */}
              <button
                type="button"
                onClick={() => setInvitationsDrawerOpen(true)}
                className="relative px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                aria-label="View Invitations"
              >
                <span>📬 Invitations</span>
                {pendingInvitationsCount > 0 && (
                  <span className="h-4 min-w-4 px-1 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {pendingInvitationsCount}
                  </span>
                )}
              </button>

              {/* Authentication Status / Switcher */}
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-purple-900/50 hover:border-purple-600 transition-colors cursor-pointer text-left"
                >
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white leading-tight">
                      {profile?.displayName || user?.email?.split('@')[0]}
                    </span>
                    <span className="text-[9px] text-purple-400 font-mono uppercase">
                      {profile?.role === 'brand' ? 'Brand Studio' : 'Creator'}
                    </span>
                  </div>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('signin');
                      setAuthModalOpen(true);
                    }}
                    className="text-sm font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-900/80 transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('signup');
                      setAuthModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-sm shadow-purple-500/25 transition-all duration-150 cursor-pointer"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setInvitationsDrawerOpen(true)}
                className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
                aria-label="Invitations"
              >
                <span>📬</span>
                {pendingInvitationsCount > 0 && (
                  <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-purple-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-zinc-800/80 py-3 px-1 flex flex-col gap-1.5">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-900/80 rounded-lg text-base"
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
              <div className="pt-3 border-t border-zinc-800/80 flex flex-col gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalMode('signin');
                    setAuthModalOpen(true);
                  }}
                  className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white bg-zinc-900/90 border border-zinc-800 cursor-pointer"
                >
                  {isAuthenticated ? `Account (${profile?.role})` : 'Sign In'}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Invitations Drawer */}
      <InvitationsDrawer
        isOpen={invitationsDrawerOpen}
        onClose={() => setInvitationsDrawerOpen(false)}
        onOpenAuth={() => {
          setAuthModalMode('signin');
          setAuthModalOpen(true);
        }}
      />
    </>
  );
}

