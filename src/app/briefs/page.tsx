'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BriefFormData } from '@/types/brief';
import { briefService } from '@/services/briefService';
import { creatorService } from '@/services/creatorService';
import { mapBriefContentTypeToPortfolioFormat } from '@/utils/domainAdapters';
import { formatBudgetRange, isHistoricalUSDBrief } from '@/utils/formatCurrency';
import { BriefPreviewCard } from '@/components/briefs/BriefPreviewCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { isSupabaseConfigured } from '@/lib/supabase';

function CampaignsHubContent() {
  const searchParams = useSearchParams();
  const highlightedBriefId = searchParams.get('highlight') || undefined;

  const [briefs, setBriefs] = useState<BriefFormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedBrief, setSelectedBrief] = useState<BriefFormData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [storageFilter, setStorageFilter] = useState<'all' | 'remote' | 'local'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load published briefs on mount
  useEffect(() => {
    let isMounted = true;
    async function loadCampaigns() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const fetchedBriefs = await briefService.getPublishedBriefs();
        if (isMounted) {
          setBriefs(fetchedBriefs);
          if (highlightedBriefId) {
            const found = fetchedBriefs.find((b) => b.id === highlightedBriefId);
            if (found) setSelectedBrief(found);
          }
        }
      } catch (err) {
        console.warn('Failed to load campaigns:', err);
        if (isMounted) {
          setLoadError('Failed to load campaigns. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCampaigns();
    return () => {
      isMounted = false;
    };
  }, [highlightedBriefId]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = briefs.length;
    const remoteCount = briefs.filter((b) => b.savedRemotely).length;
    const localCount = briefs.filter((b) => !b.savedRemotely).length;
    const targetedCount = briefs.filter((b) => Boolean(b.invitedCreatorId)).length;
    return { total, remoteCount, localCount, targetedCount };
  }, [briefs]);

  // Filtered briefs list
  const filteredBriefs = useMemo(() => {
    return briefs.filter((b) => {
      // Storage filter
      if (storageFilter === 'remote' && !b.savedRemotely) return false;
      if (storageFilter === 'local' && b.savedRemotely) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = b.title.toLowerCase().includes(q);
      const matchBrand = b.brandName.toLowerCase().includes(q);
      const matchType = b.contentType.toLowerCase().includes(q);
      const matchId = b.id ? b.id.toLowerCase().includes(q) : false;
      const targetCreator = b.invitedCreatorId
        ? creatorService.getCreatorById(b.invitedCreatorId)
        : null;
      const matchCreator = targetCreator
        ? targetCreator.name.toLowerCase().includes(q)
        : false;

      return matchTitle || matchBrand || matchType || matchId || matchCreator;
    });
  }, [briefs, storageFilter, searchQuery]);

  const handleCopyBriefId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-850">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <Link href="/" className="hover:text-zinc-200 transition-colors">
                CreatorBridge.ai
              </Link>
              <span>/</span>
              <span className="text-purple-400">Campaigns Hub</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-medium self-start backdrop-blur">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>Production Management</span>
              <span className="text-purple-400/60">•</span>
              <span className="text-zinc-400 text-[11px] font-mono">Campaign Specifications</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Campaigns Hub
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
              Track and manage your published creative briefs and creator invitations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            <Link href="/creators">
              <Button variant="outline" size="sm">
                Explore Creators
              </Button>
            </Link>
            <Link href="/briefs/new">
              <Button variant="primary" size="sm">
                + Create a Brief
              </Button>
            </Link>
          </div>
        </div>

        {/* Metrics Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-1">
            <span className="text-xs text-zinc-400 font-medium">Total Campaigns</span>
            <span className="text-2xl font-bold text-white tracking-tight">{metrics.total}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-1">
            <span className="text-xs text-emerald-400 font-medium">Database Synced</span>
            <span className="text-2xl font-bold text-emerald-300 tracking-tight">{metrics.remoteCount}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-1">
            <span className="text-xs text-amber-400 font-medium">Local Browser</span>
            <span className="text-2xl font-bold text-amber-300 tracking-tight">{metrics.localCount}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-1">
            <span className="text-xs text-purple-400 font-medium">Targeted Briefs</span>
            <span className="text-2xl font-bold text-purple-300 tracking-tight">{metrics.targetedCount}</span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-850">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by title, brand, format, or creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-zinc-950/80 p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setStorageFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                storageFilter === 'all'
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({briefs.length})
            </button>
            <button
              type="button"
              onClick={() => setStorageFilter('remote')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                storageFilter === 'remote'
                  ? 'bg-zinc-800 text-emerald-400 font-medium'
                  : 'text-zinc-400 hover:text-emerald-400'
              }`}
            >
              Database ({metrics.remoteCount})
            </button>
            <button
              type="button"
              onClick={() => setStorageFilter('local')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                storageFilter === 'local'
                  ? 'bg-zinc-800 text-amber-400 font-medium'
                  : 'text-zinc-400 hover:text-amber-400'
              }`}
            >
              Local ({metrics.localCount})
            </button>
          </div>
        </div>

        {/* Selected Brief Inspection Modal / Drawer */}
        {selectedBrief && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <Badge variant={selectedBrief.savedRemotely ? 'verified' : 'default'}>
                    {selectedBrief.savedRemotely ? '✓ Supabase Live Record' : 'Local Browser Store'}
                  </Badge>
                  <span className="text-xs font-mono text-indigo-400 uppercase">
                    {selectedBrief.id}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBrief(null)}
                >
                  ✕ Close Spec
                </Button>
              </div>

              {/* Brief Spec Preview Card */}
              <BriefPreviewCard
                data={selectedBrief}
                creatorName={
                  selectedBrief.invitedCreatorId
                    ? creatorService.getCreatorById(selectedBrief.invitedCreatorId)?.name
                    : undefined
                }
              />

              {/* Action Toolbar */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-zinc-400">
                  {selectedBrief.savedRemotely ? (
                    <span>
                      Synchronized to PostgreSQL table <code className="text-zinc-300">campaign_briefs</code>.
                    </span>
                  ) : (
                    <span>
                      Persisted locally in browser storage. Not yet synced to remote database.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link
                    href={`/creators?search=${encodeURIComponent(
                      mapBriefContentTypeToPortfolioFormat(selectedBrief.contentType) || ''
                    )}`}
                    className="flex-1 sm:flex-none"
                  >
                    <Button variant="primary" size="sm" className="w-full">
                      Find Matching Creators →
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBrief(null)}
                    className="flex-1 sm:flex-none"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
            <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span className="text-sm font-medium text-zinc-300">Loading campaign briefs...</span>
            <span className="text-xs text-zinc-500">Reconciling remote database and local storage records</span>
          </div>
        )}

        {/* Error State */}
        {!isLoading && loadError && (
          <div className="p-8 rounded-2xl border border-red-900/50 bg-red-950/20 text-center flex flex-col items-center gap-3">
            <span className="text-2xl text-red-400">⚠️</span>
            <h3 className="text-base font-semibold text-white">Error Loading Campaigns</h3>
            <p className="text-xs text-zinc-400 max-w-md">{loadError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Briefs Cards Grid */}
        {!isLoading && !loadError && filteredBriefs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBriefs.map((brief) => {
              const targetCreator = brief.invitedCreatorId
                ? creatorService.getCreatorById(brief.invitedCreatorId)
                : null;
              const portfolioFormat = mapBriefContentTypeToPortfolioFormat(brief.contentType);

              return (
                <div
                  key={brief.id}
                  className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:border-purple-500/40 hover:bg-zinc-900/80 transition-all flex flex-col justify-between gap-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2.5">
                    {/* Header Row: ID + Storage Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider">
                          {brief.id}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyBriefId(brief.id || '', e)}
                          className="text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer font-mono"
                          title="Copy ID"
                        >
                          {copiedId === brief.id ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>

                      <Badge
                        variant={brief.savedRemotely ? 'verified' : 'default'}
                        className="text-[10px]"
                      >
                        {brief.savedRemotely ? '✓ Live in Database' : 'Local Store'}
                      </Badge>
                    </div>

                    {/* Brief Title & Brand */}
                    <div className="flex flex-col gap-1">
                      <h2 className="text-base font-bold text-white tracking-tight line-clamp-1">
                        {brief.title}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                        <span className="text-zinc-200 font-medium">{brief.brandName}</span>
                        <span>•</span>
                        <span>{brief.contentType}</span>
                        {portfolioFormat && (
                          <>
                            <span>•</span>
                            <span className="text-purple-300 text-[11px] font-medium">
                              Format: {portfolioFormat}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Targeted Creator Banner (if assigned) */}
                    {targetCreator ? (
                      <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-[11px] text-purple-300 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                          <span>
                            Targeted to <strong className="text-white">{targetCreator.name}</strong>
                          </span>
                        </div>
                        <span className="text-[10px] font-medium tracking-wide text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-800/40 shrink-0">
                          Targeted Creator
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-zinc-500 font-medium">
                        Open Campaign • Open to matching creators
                      </div>
                    )}

                    {/* Metadata Summary */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850/80 text-[11px] text-zinc-400">
                      <div>
                        <span className="text-zinc-500 block">Deliverables:</span>
                        <span className="text-zinc-200">{brief.deliverablesCount} Asset(s)</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Deadline:</span>
                        <span className="text-zinc-200">{brief.deadline || 'Flexible'}</span>
                      </div>
                      <div className="col-span-2 line-clamp-1">
                        <span className="text-zinc-500 mr-1">Rights:</span>
                        <span className="text-zinc-300">{brief.commercialUsage || 'Standard Commercial'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Row: Budget + Actions */}
                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Budget</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {formatBudgetRange(
                          brief.budgetMin,
                          brief.budgetMax,
                          brief.currency || (isHistoricalUSDBrief(brief.createdAt) ? 'USD' : 'INR')
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {portfolioFormat && (
                        <Link
                          href={`/creators?search=${encodeURIComponent(portfolioFormat)}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 py-0 px-2.5 text-zinc-300 hover:text-white"
                          >
                            Find Creators
                          </Button>
                        </Link>
                      )}

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedBrief(brief)}
                        className="text-xs h-8 py-0 px-3"
                      >
                        View Full Spec →
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State: No briefs or search result empty */}
        {!isLoading && !loadError && filteredBriefs.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/40 flex flex-col items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-2xl text-zinc-400">
              📋
            </div>
            {searchQuery || storageFilter !== 'all' ? (
              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-semibold text-white">No campaigns match your filters</h3>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Try clearing your search query or switching storage filter to view all campaigns.
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setStorageFilter('all');
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-semibold text-white">No published campaigns yet</h3>
                <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                  You haven&apos;t published any creative briefs yet. Create a structured brief with budget, deliverables, and commercial usage rights to begin matching with AI creators.
                </p>
                <div className="flex items-center justify-center gap-3 mt-3">
                  <Link href="/briefs/new">
                    <Button variant="primary" size="md">
                      + Create Your First Brief
                    </Button>
                  </Link>
                  <Link href="/creators">
                    <Button variant="outline" size="md">
                      Explore Creators First
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Persistence Notice at Bottom */}
        <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
            <span>
              {isSupabaseConfigured()
                ? 'Cloud database is connected. Remote records and local offline briefs are reconciled automatically.'
                : 'Running in demonstration mode with browser LocalStorage. Set Supabase keys to enable cloud sync.'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            Reconciliation Policy: Deduplicated by ID • Remote Precedence • Local Offline Preservation
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CampaignsHubPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-zinc-400">
          Loading Campaigns Hub...
        </div>
      }
    >
      <CampaignsHubContent />
    </Suspense>
  );
}
