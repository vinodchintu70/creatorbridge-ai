'use client';

import React from 'react';
import { BriefFormData } from '@/types/brief';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatBudgetRange } from '@/utils/formatCurrency';

export interface BriefPreviewCardProps {
  data: BriefFormData;
  creatorName?: string;
}

export function BriefPreviewCard({ data, creatorName }: BriefPreviewCardProps) {
  const formattedBudget = formatBudgetRange(
    data.budgetMin,
    data.budgetMax,
    data.currency || 'INR'
  );

  return (
    <Card className="border-zinc-800 bg-zinc-950/80 shadow-xl flex flex-col gap-6 p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-zinc-850">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-purple-400">
              Creative Campaign Brief
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs font-semibold text-zinc-300">{data.brandName || 'Untitled Brand'}</span>
            <Badge variant="accent" className="text-[10px]">
              {data.status === 'published' ? 'Published' : 'Draft Preview'}
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {data.title || 'Untitled Campaign'}
          </h2>
          {creatorName && (
            <div className="mt-1 px-3 py-1.5 rounded-lg bg-purple-950/30 border border-purple-800/40 text-xs text-purple-300 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span>This brief is targeted to <strong>{creatorName}</strong></span>
            </div>
          )}
        </div>

        <div className="flex sm:flex-col items-end gap-1.5 text-right shrink-0">
          <span className="text-xs font-mono text-zinc-400">Total Budget</span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            {formattedBudget}
          </span>
          {data.deadline ? (
            <span className="text-xs text-zinc-400 font-mono">
              Deadline: {data.deadline}
            </span>
          ) : (
            <span className="text-xs text-amber-400/90 font-mono">
              Deadline: Unspecified
            </span>
          )}
        </div>
      </div>

      {/* Campaign Goals & Target Audience */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            1. Campaign Objective
          </span>
          <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/50 p-4 rounded-xl border border-zinc-850">
            {data.objective || 'No objective specified yet.'}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            2. Target Audience & Distribution
          </span>
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-850 flex flex-col gap-3">
            <p className="text-sm text-zinc-300">
              {data.targetAudience || 'No target audience specified yet.'}
            </p>
            {data.channels && data.channels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-800/60">
                {data.channels.map((ch) => (
                  <Badge key={ch} variant="default" className="text-[11px]">
                    {ch}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deliverable Specifications Grid */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
          3. Deliverable Specifications
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
          <div>
            <div className="text-[11px] font-mono text-zinc-400 uppercase">Content Type</div>
            <div className="text-sm font-semibold text-zinc-200 mt-0.5 truncate">
              {data.contentType}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono text-zinc-400 uppercase">Aspect Ratio</div>
            <div className="text-sm font-semibold text-purple-300 mt-0.5">
              {data.aspectRatio || '16:9'}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono text-zinc-400 uppercase">Duration</div>
            <div className="text-sm font-semibold text-zinc-200 mt-0.5">
              {data.duration || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono text-zinc-400 uppercase">Deliverables</div>
            <div className="text-sm font-semibold text-purple-300 mt-0.5">
              {data.deliverablesCount} Asset{data.deliverablesCount > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Creative Direction */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
          4. Creative Style & Visual Direction
        </span>
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-850 text-sm text-zinc-300 leading-relaxed">
          {data.creativeStyle || 'No creative direction provided.'}
        </div>
      </div>

      {/* AI Tools & Skills Preferences */}
      {((data.preferredTools && data.preferredTools.length > 0) ||
        (data.requiredSkills && data.requiredSkills.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.preferredTools && data.preferredTools.length > 0 && (
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-850 flex flex-col gap-2">
              <span className="text-xs font-mono text-zinc-400 uppercase">Preferred Tools & Software</span>
              <div className="flex flex-wrap gap-1.5">
                {data.preferredTools.map((t) => (
                  <Badge key={t} variant="accent">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.requiredSkills && data.requiredSkills.length > 0 && (
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-850 flex flex-col gap-2">
              <span className="text-xs font-mono text-zinc-400 uppercase">Core Skills & Techniques</span>
              <div className="flex flex-wrap gap-1.5">
                {data.requiredSkills.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-xs text-zinc-200 border border-zinc-750"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Usage Rights & Policy */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
          5. Usage Rights & Safety Guidelines
        </span>
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge variant={data.commercialUsage ? 'verified' : 'default'} className="text-xs">
                {data.commercialUsage || 'Unspecified License'}
              </Badge>
              <span className="text-xs text-zinc-300">
                Territory: <strong>{data.usageTerritory || 'Unspecified'}</strong> • Duration: <strong>{data.usageDuration || 'Unspecified'}</strong>
              </span>
            </div>
            <p className="text-xs text-emerald-400/90 mt-1">
              Model Policy: {data.modelSafetyPolicy}
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
            Usage Rights & Policy
          </span>
        </div>
      </div>

      {/* Constraints & References */}
      {(data.creativeConstraints || data.referenceLinks) && (
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-850 flex flex-col gap-2 text-xs text-zinc-400">
          {data.creativeConstraints && (
            <div>
              <strong className="text-zinc-300">Negative Constraints / Brand Guardrails:</strong> {data.creativeConstraints}
            </div>
          )}
          {data.referenceLinks && (
            <div>
              <strong className="text-zinc-300">Moodboard / References:</strong> {data.referenceLinks}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
