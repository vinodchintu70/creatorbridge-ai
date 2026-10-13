'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Creator, PortfolioProject, CreatorFilterState } from '@/types/creator';
import { creatorService } from '@/services/creatorService';
import {
  filterCreators,
  countActiveFilters,
  INITIAL_FILTER_STATE,
} from '@/utils/filterCreators';
import {
  parseFiltersFromSearchParams,
  buildCreatorFilterUrl,
  areFiltersEqual,
} from '@/utils/creatorUrlState';
import { CreatorCard } from '@/components/creators/CreatorCard';
import { CreatorFilterBar } from '@/components/creators/CreatorFilterBar';
import { CreatorDetailModal } from '@/components/creators/CreatorDetailModal';
import { WorkflowInspectorModal } from '@/components/creators/WorkflowInspectorModal';
import { EmptyState } from '@/components/creators/EmptyState';
import { Button } from '@/components/ui/Button';

function CreatorsDiscoveryContent() {
  const searchParams = useSearchParams();

  // Initialize filter state from URL search params safely
  const [filters, setFilters] = useState<CreatorFilterState>(() =>
    parseFiltersFromSearchParams(searchParams)
  );

  // Selected creator initialized from URL deep link or null if invalid/absent
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(() => {
    const creatorId = searchParams.get('creator');
    if (creatorId) {
      return creatorService.getCreatorById(creatorId);
    }
    return null;
  });

  // Page-level single owner for WorkflowInspectorModal
  const [activeInspectProject, setActiveInspectProject] = useState<{
    project: PortfolioProject;
    creatorName: string;
  } | null>(null);

  // Sync with browser back/forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search);
      const creatorId = currentParams.get('creator');
      const nextCreator = creatorId ? creatorService.getCreatorById(creatorId) : null;
      const restoredFilters = parseFiltersFromSearchParams(currentParams);

      setSelectedCreator((prev) => (prev?.id === (nextCreator?.id || null) ? prev : nextCreator));
      setFilters((prev) => (areFiltersEqual(prev, restoredFilters) ? prev : restoredFilters));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Adjust state during render when searchParams changes via Next.js navigation
  const [prevSearchParams, setPrevSearchParams] = useState(searchParams);
  if (searchParams !== prevSearchParams) {
    setPrevSearchParams(searchParams);
    const creatorId = searchParams.get('creator');
    const nextCreator = creatorId ? creatorService.getCreatorById(creatorId) : null;
    if (selectedCreator?.id !== (nextCreator?.id || null)) {
      setSelectedCreator(nextCreator);
    }
    const nextFilters = parseFiltersFromSearchParams(searchParams);
    if (!areFiltersEqual(filters, nextFilters)) {
      setFilters(nextFilters);
    }
  }

  // Update filters and synchronize with URL without full page reload
  const handleFilterChange = (newFilters: CreatorFilterState) => {
    setFilters(newFilters);
    if (typeof window === 'undefined') return;

    const newUrl = buildCreatorFilterUrl(newFilters, {
      existingParams: window.location.search,
      creatorId: selectedCreator?.id || null,
    });

    if (newFilters.search !== filters.search) {
      window.history.replaceState(null, '', newUrl);
    } else {
      window.history.pushState(null, '', newUrl);
    }
  };

  // Reset all filters but preserve selected creator deep link if active
  const handleResetFilters = () => {
    setFilters(INITIAL_FILTER_STATE);
    if (typeof window === 'undefined') return;

    const newUrl = buildCreatorFilterUrl(INITIAL_FILTER_STATE, {
      existingParams: window.location.search,
      creatorId: selectedCreator?.id || null,
    });
    window.history.pushState(null, '', newUrl);
  };

  // Synchronize modal state with URL without full page reload, preserving active filters
  const handleSelectCreator = (creator: Creator | null) => {
    setSelectedCreator(creator);
    if (typeof window === 'undefined') return;

    const newUrl = buildCreatorFilterUrl(filters, {
      existingParams: window.location.search,
      creatorId: creator?.id || null,
    });
    window.history.pushState(null, '', newUrl);
  };

  // Direct workflow inspect from creator card on grid
  const handleDirectInspect = (project: PortfolioProject, creatorName: string) => {
    setActiveInspectProject({ project, creatorName });
  };

  // Unstacked workflow inspect callback requested from CreatorDetailModal
  const handleInspectFromDetail = (project: PortfolioProject, creatorName: string) => {
    setActiveInspectProject({ project, creatorName });
  };

  // Close workflow inspector without closing the underlying creator profile
  const handleCloseWorkflowInspector = () => {
    setActiveInspectProject(null);
  };

  // Central body scroll lock: active if either modal is open
  useEffect(() => {
    if (selectedCreator || activeInspectProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedCreator, activeInspectProject]);

  // Filtered creators list
  const filteredCreators = useMemo(() => {
    return filterCreators(creatorService.getAllCreators(), filters);
  }, [filters]);

  const activeCount = useMemo(() => {
    return countActiveFilters(filters);
  }, [filters]);

  const handleSuggestKeyword = (keyword: string) => {
    handleFilterChange({
      ...filters,
      search: keyword,
    });
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <Link href="/" className="hover:text-zinc-200 transition-colors">
                CreatorBridge.ai
              </Link>
              <span>/</span>
              <span className="text-purple-400">Explore Creators</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-medium self-start backdrop-blur">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>Applied AI Creator Directory</span>
              <span className="text-purple-400/60">•</span>
              <span className="text-zinc-400 text-[11px] font-mono">8 Verified Creators</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Explore Creators
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
              Discover verified AI filmmakers, animators, and visual artists for your creative campaigns.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            <Link href="/briefs/new">
              <Button variant="primary" size="sm">
                Create a Brief
              </Button>
            </Link>
            <Link href="/creators/join">
              <Button variant="secondary" size="sm">
                Join as Creator
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter System */}
        <CreatorFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleResetFilters}
          activeCount={activeCount}
          totalResults={filteredCreators.length}
        />

        {/* Creator Not Found Notice */}
        {searchParams.get('creator') && !selectedCreator && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>
                Creator profile <strong>&quot;{searchParams.get('creator')}&quot;</strong> could not be found. Browse verified creators below.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const newUrl = buildCreatorFilterUrl(filters, {
                  existingParams: typeof window !== 'undefined' ? window.location.search : '',
                  creatorId: null,
                });
                if (typeof window !== 'undefined') {
                  window.history.pushState(null, '', newUrl);
                }
              }}
              className="text-amber-300 hover:text-white underline font-medium shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Creator Results Grid */}
        {filteredCreators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCreators.map((creator) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                onSelect={handleSelectCreator}
                onInspectWorkflow={handleDirectInspect}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            searchQuery={filters.search}
            onResetFilters={handleResetFilters}
            onSuggestKeyword={handleSuggestKeyword}
            isVerifiedFilterActive={filters.verifiedOnly}
          />
        )}
      </div>

      {/* Creator Detail Modal (Unstacked) */}
      {selectedCreator && (
        <CreatorDetailModal
          creator={selectedCreator}
          isOpen={Boolean(selectedCreator)}
          onClose={() => handleSelectCreator(null)}
          onInspectWorkflow={handleInspectFromDetail}
          isWorkflowInspectorOpen={Boolean(activeInspectProject)}
        />
      )}

      {/* Single Page-Level Workflow Inspector Modal */}
      {activeInspectProject && (
        <WorkflowInspectorModal
          project={activeInspectProject.project}
          creatorName={activeInspectProject.creatorName}
          isOpen={Boolean(activeInspectProject)}
          onClose={handleCloseWorkflowInspector}
        />
      )}
    </div>
  );
}

function CreatorsDiscoveryWithParams() {
  return <CreatorsDiscoveryContent />;
}

export default function CreatorsDiscoveryPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-zinc-400">
          Loading Creators...
        </div>
      }
    >
      <CreatorsDiscoveryWithParams />
    </Suspense>
  );
}
