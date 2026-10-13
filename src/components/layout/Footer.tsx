import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-850 bg-zinc-950 text-zinc-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-200">CreatorBridge AI</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Kampus.VC Hackathon
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-md">
              AI-native marketplace connecting brands with verified generative creators, workflow lineage, and structured creative briefs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-400">
            <Link href="/creators" className="hover:text-zinc-200 transition-colors">
              Explore Creators
            </Link>
            <Link href="/briefs/new" className="hover:text-zinc-200 transition-colors">
              Create a Brief
            </Link>
            <Link href="/creators/join" className="hover:text-zinc-200 transition-colors">
              Creator Onboarding
            </Link>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">Transparent Creator Marketplace</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© 2026 CreatorBridge AI. Built for the Applied AI Hackathon.</p>
          <p className="flex items-center gap-2">
            <span>Evidence-Based AI Verification</span>
            <span>•</span>
            <span>Per-Project Workflows</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
