'use client';

import React from 'react';
import Image from 'next/image';
import { Creator, PortfolioProject } from '@/types/creator';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getProvenanceDetails } from '@/utils/provenance';

export interface CreatorCardProps {
  creator: Creator;
  onSelect: (creator: Creator) => void;
  onInspectWorkflow?: (project: PortfolioProject, creatorName: string) => void;
}

/**
 * Minimal CreatorCard component with reduced information density.
 * Displays project imagery, creator identity, one-sentence bio, up to 3 tools,
 * estimated starting rate, and one primary "View Portfolio" action.
 * Technical parameters, workflow recipes, and licensing are available in the profile modal.
 */
export function CreatorCard({
  creator,
  onSelect,
}: CreatorCardProps) {
  const portfolioList = Array.isArray(creator.portfolio) ? creator.portfolio : [];
  const featured = portfolioList[0];
  const provenance = getProvenanceDetails(creator.verification);

  return (
    <Card
      hoverEffect
      className="group flex flex-col justify-between overflow-hidden rounded-2xl border-zinc-800/90 hover:border-purple-500/40 bg-zinc-900/60 shadow-lg shadow-black/20 backdrop-blur transition-all duration-300 cursor-pointer"
      onClick={() => onSelect(creator)}
    >
      {/* Featured Cinematic Portfolio Thumbnail or Fallback Header */}
      {featured ? (
        <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden">
          <Image
            src={featured.thumbnailUrl}
            alt={featured.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Verification / Provenance status: small, clear badge */}
          <div className="absolute top-3 right-3 z-10" title={provenance.explanation}>
            <Badge
              variant={provenance.badgeVariant}
              className="text-[10px] py-0.5 px-2 bg-black/75 backdrop-blur font-medium shadow-sm"
            >
              {provenance.badgeIcon} {provenance.label}
            </Badge>
          </div>

          {/* Concise project title overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/50 to-transparent p-3 pt-6">
            <span className="text-xs font-semibold text-white truncate block">
              {featured.title}
            </span>
          </div>
        </div>
      ) : (
        <div className="relative aspect-video w-full bg-gradient-to-br from-zinc-900 via-purple-950/20 to-zinc-950 overflow-hidden flex flex-col items-center justify-center p-4 border-b border-zinc-800/60">
          <div className="text-center flex flex-col items-center gap-1.5 text-zinc-400">
            <span className="text-2xl opacity-70">🎬</span>
            <span className="text-xs font-medium text-zinc-300">Specimen Showcase in Review</span>
            <span className="text-[10px] text-zinc-500 font-mono">Profile active for campaign briefs</span>
          </div>
          <div className="absolute top-3 right-3 z-10" title={provenance.explanation}>
            <Badge
              variant={provenance.badgeVariant}
              className="text-[10px] py-0.5 px-2 bg-black/75 backdrop-blur font-medium shadow-sm"
            >
              {provenance.badgeIcon} {provenance.label}
            </Badge>
          </div>
        </div>
      )}

      {/* Creator Info & Metadata */}
      <CardContent className="p-5 flex flex-col gap-3.5 flex-1 justify-between">
        <div className="flex flex-col gap-3">
          {/* Avatar + Name + Specialization & Location */}
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full overflow-hidden border border-zinc-700 bg-zinc-800 shrink-0">
              <Image
                src={creator.avatarUrl}
                alt={creator.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col min-w-0">
              <h3 className="text-base font-bold text-white tracking-tight truncate group-hover:text-purple-300 transition-colors">
                {creator.name}
              </h3>
              <p className="text-xs text-zinc-400 truncate">
                <span className="text-purple-400 font-medium">{creator.specialization}</span>
                <span className="mx-1.5 text-zinc-600">•</span>
                <span>{creator.location}</span>
              </p>
            </div>
          </div>

          {/* One-sentence creator description */}
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {creator.bio}
          </p>

          {/* Up to 3 important AI tools with compact overflow */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {(creator.primaryTools || []).slice(0, 3).map((tool) => (
              <span
                key={tool}
                className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-750 font-medium"
              >
                {tool}
              </span>
            ))}
            {(creator.primaryTools || []).length > 3 && (
              <span className="text-[10px] text-zinc-400 font-medium ml-0.5">
                +{(creator.primaryTools || []).length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Footer info: Starting Rate & Single Primary Action */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3 mt-1">
          <div className="text-xs">
            <span className="text-zinc-500 block text-[10px] font-medium">Starting Rate</span>
            <span className="text-xs font-semibold text-zinc-200">
              {creator.rateEstimate
                ? creator.rateEstimate.startsWith('Est.')
                  ? creator.rateEstimate
                  : `Est. ${creator.rateEstimate}`
                : 'Rate on Request'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(creator);
            }}
            className="text-xs font-semibold group-hover:border-purple-500/50 group-hover:text-white"
          >
            View Portfolio →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
