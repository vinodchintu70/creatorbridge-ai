'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

export interface EmptyStateProps {
  searchQuery?: string;
  onResetFilters: () => void;
  onSuggestKeyword?: (keyword: string) => void;
  isVerifiedFilterActive?: boolean;
}

export function EmptyState({
  searchQuery,
  onResetFilters,
  onSuggestKeyword,
  isVerifiedFilterActive,
}: EmptyStateProps) {
  const suggestedKeywords = ['Runway', 'Flux', 'Perfume', 'ComfyUI', 'Animation'];

  return (
    <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
      <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center mb-4">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
          />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-white tracking-tight">
        No creators found
      </h3>

      <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
        {searchQuery ? (
          <>
            No creators matched your search for <span className="text-zinc-200 font-mono">&quot;{searchQuery}&quot;</span> with the selected filters. Try removing a filter or searching for a simpler keyword like &quot;video&quot; or &quot;art&quot;.
          </>
        ) : (
          'No creators match this combination of filters. Try clearing some filters to see more talent.'
        )}
      </p>

      {isVerifiedFilterActive && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 leading-relaxed text-left">
          <strong>Honest Provenance Note:</strong> All 8 demonstration creators are classified as <em>Demo Evidence</em> or <em>Self-Reported</em> to prevent false claims of unverified third-party audits. Uncheck &quot;Verified Evidence Only&quot; to view all creators.
        </div>
      )}

      {/* Suggested Keywords */}
      {onSuggestKeyword && (
        <div className="mt-5 flex flex-col items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium">Try searching for popular styles or tools:</span>
          <div className="flex flex-wrap justify-center gap-1.5">
            {suggestedKeywords.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => onSuggestKeyword(kw)}
                className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-purple-300 hover:border-purple-500/50 hover:bg-zinc-850 hover:text-white transition-colors cursor-pointer font-medium"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={onResetFilters}>
          Reset All Filters
        </Button>
      </div>
    </div>
  );
}
