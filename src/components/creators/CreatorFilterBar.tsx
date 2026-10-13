'use client';

import React, { useState } from 'react';
import {
  AITool,
  CreatorSpecialization,
  ContentType,
  AspectRatio,
  CommercialSuitability,
  CreatorFilterState,
} from '@/types/creator';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const AVAILABLE_TOOLS: AITool[] = [
  'Flux.1 Dev',
  'Runway Gen-3',
  'Midjourney v6',
  'ComfyUI',
  'Kling 1.5',
  'ElevenLabs',
  'Suno',
  'Luma Dream Machine',
];

const AVAILABLE_SPECIALIZATIONS: CreatorSpecialization[] = [
  'AI Commercials',
  'Generative Animation',
  'Virtual Influencers',
  'Product VFX',
  'Cinematic Worldbuilding',
  'Fashion & Editorial',
];

const AVAILABLE_CONTENT_TYPES: ContentType[] = [
  'Video',
  'Animation',
  'Still Image',
  '3D Asset',
];

const AVAILABLE_ASPECT_RATIOS: AspectRatio[] = [
  '16:9 Landscape',
  '9:16 Vertical',
  '1:1 Square',
  '2.39:1 Cinemascope',
];

const AVAILABLE_COMMERCIAL_LICENSES: { id: CommercialSuitability | 'all'; label: string }[] = [
  { id: 'all', label: 'All Usage Rights' },
  { id: 'Full IP Buyout', label: 'Full Commercial Buyout' },
  { id: 'Exclusive Commercial', label: 'Exclusive Commercial' },
  { id: 'Standard Agency', label: 'Standard Agency License' },
];

export interface CreatorFilterBarProps {
  filters: CreatorFilterState;
  onFilterChange: (newFilters: CreatorFilterState) => void;
  onClearFilters: () => void;
  activeCount: number;
  totalResults: number;
}

/**
 * Minimal CreatorFilterBar component with progressive disclosure.
 * Primary view exposes search, verified-only toggle, tools, and creative focus.
 * Secondary filters (Format, Aspect Ratio, Usage Rights) are organized under a collapsible "More filters" section.
 */
export function CreatorFilterBar({
  filters,
  onFilterChange,
  onClearFilters,
  activeCount,
  totalResults,
}: CreatorFilterBarProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Secondary active filters (Content Type, Aspect Ratio, Commercial License)
  const secondaryActiveCount =
    filters.contentTypes.length +
    filters.aspectRatios.length +
    (filters.commercialLicense !== 'all' ? 1 : 0);

  // Default moreFiltersOpen to true if any secondary filter is currently active
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(() => secondaryActiveCount > 0);

  // Toggle multi-select items helper
  const toggleItem = <T,>(list: T[], item: T): T[] => {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
  };

  return (
    <div className="w-full flex flex-col gap-5 p-5 sm:p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl shadow-black/20 backdrop-blur-md">
      {/* Top Search & Primary Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Prominent Search Input */}
        <div className="flex-1 max-w-xl">
          <Input
            id="creator-search-input"
            placeholder="Search creators by name, style, or tool..."
            value={filters.search}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            leftIcon={
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
            aria-label="Search creators"
          />
        </div>

        {/* Quick Controls: Verified Only, Results, and Reset */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 flex-wrap">
          {/* Verified Evidence Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-emerald-400 font-medium px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  verifiedOnly: e.target.checked,
                })
              }
              className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            <span>Verified Only</span>
          </label>

          <div className="text-xs text-zinc-400 font-medium">
            <span className="font-semibold text-white">{totalResults}</span>{' '}
            {totalResults === 1 ? 'creator' : 'creators'}
          </div>

          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium px-2 py-1"
            >
              Reset ({activeCount})
            </Button>
          )}

          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span>Filters {activeCount > 0 ? `(${activeCount})` : ''}</span>
          </Button>
        </div>
      </div>

      {/* Filter Chips Container */}
      <div className={`flex-col gap-4 ${mobileFilterOpen ? 'flex' : 'hidden md:flex'}`}>
        {/* Frequently Used: Tools & Software */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          <span className="text-xs font-semibold text-zinc-400 shrink-0 w-28 tracking-normal">
            AI Tools:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_TOOLS.map((tool) => {
              const isSelected = filters.tools.includes(tool);
              return (
                <button
                  key={tool}
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      tools: toggleItem(filters.tools, tool),
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 border cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500/50 shadow-sm shadow-purple-500/20'
                      : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {tool}
                </button>
              );
            })}
          </div>
        </div>

        {/* Frequently Used: Creative Focus */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          <span className="text-xs font-semibold text-zinc-400 shrink-0 w-28 tracking-normal">
            Specialization:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_SPECIALIZATIONS.map((spec) => {
              const isSelected = filters.specializations.includes(spec);
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      specializations: toggleItem(filters.specializations, spec),
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 border cursor-pointer ${
                    isSelected
                      ? 'bg-purple-500/20 text-purple-200 border-purple-500/40 shadow-sm shadow-purple-500/10'
                      : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {spec}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Secondary Filters Toggle */}
        <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-purple-300 transition-colors cursor-pointer py-1"
            aria-expanded={moreFiltersOpen}
          >
            <span>{moreFiltersOpen ? 'Fewer filters' : 'More filters'}</span>
            {secondaryActiveCount > 0 && !moreFiltersOpen && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30">
                {secondaryActiveCount} active
              </span>
            )}
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${moreFiltersOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Secondary Filters Section (Format, Aspect Ratio, Usage Rights) */}
        {moreFiltersOpen && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-1 animate-in fade-in duration-200">
            {/* Content Type / Format */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">Format:</span>
              <div className="flex gap-1.5">
                {AVAILABLE_CONTENT_TYPES.map((ct) => {
                  const isSelected = filters.contentTypes.includes(ct);
                  return (
                    <button
                      key={ct}
                      type="button"
                      onClick={() =>
                        onFilterChange({
                          ...filters,
                          contentTypes: toggleItem(filters.contentTypes, ct),
                        })
                      }
                      className={`px-2.5 py-1 rounded-md text-xs transition-colors border cursor-pointer font-medium ${
                        isSelected
                          ? 'bg-zinc-200 text-zinc-950 border-white font-semibold shadow-sm'
                          : 'bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      {ct}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">Aspect Ratio:</span>
              <div className="flex gap-1.5">
                {AVAILABLE_ASPECT_RATIOS.map((ar) => {
                  const isSelected = filters.aspectRatios.includes(ar);
                  return (
                    <button
                      key={ar}
                      type="button"
                      onClick={() =>
                        onFilterChange({
                          ...filters,
                          aspectRatios: toggleItem(filters.aspectRatios, ar),
                        })
                      }
                      className={`px-2.5 py-1 rounded-md text-xs transition-colors border cursor-pointer font-medium ${
                        isSelected
                          ? 'bg-zinc-200 text-zinc-950 border-white font-semibold shadow-sm'
                          : 'bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      {ar}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Commercial Usage Rights */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">Usage Rights:</span>
              <select
                value={filters.commercialLicense}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    commercialLicense: e.target.value as CommercialSuitability | 'all',
                  })
                }
                aria-label="Filter by usage rights"
                className="bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 cursor-pointer"
              >
                {AVAILABLE_COMMERCIAL_LICENSES.map((lic) => (
                  <option key={lic.id} value={lic.id}>
                    {lic.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
