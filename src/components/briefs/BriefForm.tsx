'use client';

import React from 'react';
import {
  BriefFormData,
  BriefContentType,
  BriefDistributionChannel,
  BriefCommercialUsage,
  BriefModelSafetyPolicy,
  BriefValidationErrors,
} from '@/types/brief';
import { AITool } from '@/types/creator';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  getSmartToolAndSkillRecommendations,
  ALL_AVAILABLE_TOOLS,
  ALL_AVAILABLE_SKILLS,
  RECOMMENDATIONS_DISCLAIMER,
} from '@/utils/briefRecommendations';

const AVAILABLE_CHANNELS: BriefDistributionChannel[] = [
  'Instagram / Reels',
  'TikTok',
  'YouTube',
  'Digital OOH / Billboard',
  'Broadcast TV',
  'Brand Website / App',
];

const CONTENT_TYPES: BriefContentType[] = [
  'Brand Commercial Video',
  'Social Video Reel / UGC',
  '3D Product VFX',
  'Key Visual Still',
  'Virtual Persona Asset',
  'Generative Animation',
];

const ASPECT_RATIO_PRESETS = [
  '16:9 Landscape (4K UHD 3840x2160)',
  '9:16 Vertical (Mobile 1080x1920)',
  '1:1 Square (1080x1080)',
  '2.39:1 Cinemascope Anamorphic',
  'Multi-Format Deliverable Pack',
];

const DURATION_PRESETS = [
  '15 seconds (High-Velocity Reel)',
  '30 seconds (Standard Commercial)',
  '60 seconds (Brand Anthem)',
  'Static High-Res Still (Single Frame)',
  'Multi-Asset Package (Varying Cuts)',
];

const COMMERCIAL_LICENSES: { value: Exclude<BriefCommercialUsage, ''>; label: string; desc: string }[] = [
  {
    value: 'Full Global IP Buyout',
    label: 'Full Commercial Ownership (Buyout)',
    desc: 'Full copyright transfer upon delivery',
  },
  {
    value: '1-Year Digital Exclusive',
    label: '1-Year Digital Exclusive',
    desc: 'Exclusive digital rights for 12 months',
  },
  {
    value: 'Standard Agency License',
    label: 'Standard Agency License',
    desc: 'Brand marketing and paid distribution rights',
  },
  {
    value: 'Restricted Social Use',
    label: 'Social Media Only',
    desc: 'Organic or paid social media channels only',
  },
];

const SAFETY_POLICIES: BriefModelSafetyPolicy[] = [
  'Commercial-Safe Checkpoints Only (Zero Unlicensed LoRAs)',
  'Proprietary Brand-Owned LoRAs Only',
  'Creator Discretion with Commercial Warranty',
];

const TERRITORY_PRESETS = [
  'Worldwide / Global',
  'North America (US & CA)',
  'Europe (EU & UK)',
  'Digital Web Only',
];

const DURATION_TAG_PRESETS = [
  'Perpetual / In Perpetuity',
  '1-Year Digital Exclusive',
  '6-Month Social UGC',
  '90-Day Campaign',
];

export interface BriefFormProps {
  data: BriefFormData;
  errors: BriefValidationErrors;
  onChange: (updated: BriefFormData) => void;
  onSaveDraft: () => void;
  onProceedToReview: () => void;
  creatorName?: string;
  unansweredAIFields?: string[];
}

export function BriefForm({
  data,
  errors,
  onChange,
  onSaveDraft,
  onProceedToReview,
  creatorName,
  unansweredAIFields,
}: BriefFormProps) {
  // Toggle channel
  const handleToggleChannel = (channel: BriefDistributionChannel) => {
    const channels = data.channels || [];
    const next = channels.includes(channel)
      ? channels.filter((c) => c !== channel)
      : [...channels, channel];
    onChange({ ...data, channels: next });
  };

  // Toggle preferred tool
  const handleToggleTool = (tool: AITool) => {
    const tools = data.preferredTools || [];
    const next = tools.includes(tool)
      ? tools.filter((t) => t !== tool)
      : [...tools, tool];
    onChange({ ...data, preferredTools: next });
  };

  // Toggle preferred skill
  const handleToggleSkill = (skill: string) => {
    const skills = data.requiredSkills || [];
    const next = skills.includes(skill)
      ? skills.filter((s) => s !== skill)
      : [...skills, skill];
    onChange({ ...data, requiredSkills: next });
  };

  // Calculate smart tool and skill recommendations dynamically based on current campaign fields
  const recommendations = React.useMemo(() => {
    return getSmartToolAndSkillRecommendations(data);
  }, [data]);

  // Bulk add suggested skills without overwriting existing selections
  const handleAddAllSuggestedSkills = () => {
    const current = new Set(data.requiredSkills || []);
    recommendations.suggestedSkills.forEach((s) => current.add(s));
    onChange({ ...data, requiredSkills: Array.from(current) });
  };

  // Bulk add suggested tools without overwriting existing selections
  const handleAddAllSuggestedTools = () => {
    const current = new Set(data.preferredTools || []);
    recommendations.suggestedTools.forEach((t) => current.add(t));
    onChange({ ...data, preferredTools: Array.from(current) });
  };

  // Distinguish remaining platform skills and tools not present in suggestions
  const otherSkills = ALL_AVAILABLE_SKILLS.filter(
    (s) => !recommendations.suggestedSkills.includes(s)
  );
  const otherTools = ALL_AVAILABLE_TOOLS.filter(
    (t) => !recommendations.suggestedTools.includes(t)
  );

  return (
    <div className="w-full flex flex-col gap-8 pb-32">
      {/* Targeted Creator Banner */}
      {creatorName && (
        <div className="px-4 py-3 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-zinc-200">
              Direct Brief Invitation for <strong className="text-white font-semibold">{creatorName}</strong>
            </span>
          </div>
          <span className="text-[11px] font-medium text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded border border-purple-700/50">
            Targeted Creator
          </span>
        </div>
      )}

      {/* Unanswered AI Fields Callout */}
      {unansweredAIFields && unansweredAIFields.length > 0 && (
        <div className="px-4 py-3 rounded-xl bg-amber-950/30 border border-amber-600/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-amber-400 text-sm">✦</span>
            <span className="text-amber-200 font-medium">Fields requiring your input:</span>
            <div className="flex flex-wrap gap-1.5">
              {unansweredAIFields.map((field) => {
                const label =
                  field === 'brandName'
                    ? 'Brand Name'
                    : field === 'budget'
                    ? 'Budget Range'
                    : field === 'deadline'
                    ? 'Delivery Deadline'
                    : field === 'commercialUsage'
                    ? 'Commercial License'
                    : field;
                return (
                  <span
                    key={field}
                    className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-700/60 text-[11px] font-medium text-amber-100"
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: Campaign Basics */}
      <section className="p-6 sm:p-7 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm flex flex-col gap-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/70 border border-purple-800/60 px-2 py-0.5 rounded">
              01
            </span>
            <span>Campaign Basics</span>
          </h2>
          <span className="text-[11px] text-zinc-500 font-medium">* Required</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Campaign Title *"
            placeholder="e.g. Summer Luxury Product Teaser"
            value={data.title}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            error={errors.title}
          />

          <div className="flex flex-col gap-1">
            <Input
              label="Brand or Agency Name *"
              placeholder="e.g. Lumina Labs"
              value={data.brandName}
              onChange={(e) => onChange({ ...data, brandName: e.target.value })}
              error={errors.brandName}
            />
            {unansweredAIFields?.includes('brandName') && !data.brandName && (
              <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                <span>⚠️</span> Brand name required
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="objective" className="text-xs font-medium text-zinc-300">
            Campaign Objective *
          </label>
          <textarea
            id="objective"
            rows={3}
            placeholder="e.g. We are launching a new luxury acoustic product. We need a 30s teaser video highlighting aerospace materials, sound caustics, and premium finish to drive website pre-orders."
            value={data.objective}
            onChange={(e) => onChange({ ...data, objective: e.target.value })}
            className={`w-full rounded-lg bg-zinc-900 border text-zinc-100 placeholder-zinc-500 text-sm p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.objective ? 'border-red-500/80 focus:ring-red-500' : 'border-zinc-800 hover:border-zinc-700'
            }`}
          />
          {errors.objective && <p className="text-xs text-red-400 mt-0.5">{errors.objective}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Target Audience *"
            placeholder="e.g. Tech enthusiasts & luxury buyers aged 25–40"
            value={data.targetAudience}
            onChange={(e) => onChange({ ...data, targetAudience: e.target.value })}
            error={errors.targetAudience}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Primary Channels *
            </label>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {AVAILABLE_CHANNELS.map((ch) => {
                const isSelected = data.channels?.includes(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => handleToggleChannel(ch)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/25 border-purple-500 text-purple-200 font-medium shadow-sm ring-1 ring-purple-500/50'
                        : 'bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
            {errors.channels && <p className="text-xs text-red-400 mt-0.5">{errors.channels}</p>}
          </div>
        </div>
      </section>

      {/* SECTION 2: Deliverables & Specifications */}
      <section className="p-6 sm:p-7 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm flex flex-col gap-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/70 border border-purple-800/60 px-2 py-0.5 rounded">
              02
            </span>
            <span>Deliverables & Specifications</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contentType" className="text-xs font-medium text-zinc-300">
              Content Type *
            </label>
            <select
              id="contentType"
              value={data.contentType}
              onChange={(e) => onChange({ ...data, contentType: e.target.value as BriefContentType })}
              className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-zinc-700 cursor-pointer"
            >
              {CONTENT_TYPES.map((ct) => (
                <option key={ct} value={ct}>{ct}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="aspectRatio" className="text-xs font-medium text-zinc-300">
              Aspect Ratio & Resolution *
            </label>
            <select
              id="aspectRatio"
              value={data.aspectRatio}
              onChange={(e) => onChange({ ...data, aspectRatio: e.target.value })}
              className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-zinc-700 cursor-pointer"
            >
              {ASPECT_RATIO_PRESETS.map((ar) => (
                <option key={ar} value={ar}>{ar}</option>
              ))}
            </select>
            {errors.aspectRatio && <p className="text-xs text-red-400 mt-0.5">{errors.aspectRatio}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="duration" className="text-xs font-medium text-zinc-300">
              Duration / Length
            </label>
            <select
              id="duration"
              value={data.duration}
              onChange={(e) => onChange({ ...data, duration: e.target.value })}
              className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-zinc-700 cursor-pointer"
            >
              {DURATION_PRESETS.map((dur) => (
                <option key={dur} value={dur}>{dur}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Number of Deliverables *"
            type="number"
            min={1}
            max={50}
            placeholder="1"
            value={data.deliverablesCount}
            onChange={(e) => onChange({ ...data, deliverablesCount: Number(e.target.value) })}
            error={errors.deliverablesCount}
          />

          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="creativeStyle" className="text-xs font-medium text-zinc-300">
              Creative Style & Direction *
            </label>
            <textarea
              id="creativeStyle"
              rows={2}
              placeholder="e.g. 35mm anamorphic cinematic look, dark obsidian glass reflections, macro liquid caustics, slow volumetric light sweep"
              value={data.creativeStyle}
              onChange={(e) => onChange({ ...data, creativeStyle: e.target.value })}
              className={`w-full rounded-lg bg-zinc-900 border text-zinc-100 placeholder-zinc-500 text-sm p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.creativeStyle ? 'border-red-500/80 focus:ring-red-500' : 'border-zinc-800 hover:border-zinc-700'
              }`}
            />
            {errors.creativeStyle && <p className="text-xs text-red-400 mt-0.5">{errors.creativeStyle}</p>}
          </div>
        </div>
      </section>

      {/* SECTION 3: Smart AI Tools & Creator Skills (Recommendations) */}
      <section className="p-6 sm:p-7 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm flex flex-col gap-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/70 border border-purple-800/60 px-2 py-0.5 rounded">
              03
            </span>
            <span>Preferred Tools & Creator Skills</span>
          </h2>
          <span className="text-[11px] text-zinc-500 font-medium">Optional Preferences</span>
        </div>

        {/* Dynamic Context-Aware Suggestion Banner */}
        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-start sm:items-center gap-2">
            <span className="text-purple-400 font-bold shrink-0">✦ Suggestions:</span>
            <span className="text-zinc-300">
              Matched for <strong className="text-white">{data.contentType}</strong> — {recommendations.rationale}
            </span>
          </div>
          <span className="text-[11px] text-purple-300/80 shrink-0 font-medium">
            Click chips to toggle
          </span>
        </div>

        {/* Part A: Required Creator Capabilities (Skills) */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-zinc-200">
                Required Creator Skills & Capabilities
              </span>
              <span className="text-[11px] text-zinc-400">
                Core technical competencies expected from the matched creator
              </span>
            </div>
            {recommendations.suggestedSkills.some((s) => !data.requiredSkills?.includes(s)) && (
              <button
                type="button"
                onClick={handleAddAllSuggestedSkills}
                className="text-[11px] text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/50 px-2.5 py-1 rounded-md cursor-pointer transition-colors"
              >
                + Add All Suggested Skills
              </button>
            )}
          </div>

          {/* Suggested Skills */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-mono text-purple-400/90 mr-1">✦ Suggested:</span>
            {recommendations.suggestedSkills.map((skill) => {
              const isSelected = data.requiredSkills?.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleToggleSkill(skill)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors border cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-medium shadow-sm ring-1 ring-purple-500/50'
                      : 'bg-zinc-900/90 text-purple-300/90 border-purple-800/50 hover:border-purple-600 hover:text-white'
                  }`}
                >
                  <span className="text-[10px]">{isSelected ? '✓' : '+'}</span>
                  <span>{skill}</span>
                </button>
              );
            })}
          </div>

          {/* Other Platform Skills */}
          {otherSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center pt-1">
              <span className="text-[11px] text-zinc-500 mr-1">Other Skills:</span>
              {otherSkills.map((skill) => {
                const isSelected = data.requiredSkills?.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleToggleSkill(skill)}
                    className={`px-2 py-0.5 rounded-md text-[11px] transition-colors border cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/25 border-purple-500 text-purple-200 font-medium'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {isSelected ? `✓ ${skill}` : skill}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Part B: Preferred AI Generation Tools (Software) */}
        <div className="flex flex-col gap-2.5 pt-3 border-t border-zinc-850/80">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-zinc-200">
                Preferred AI Tools & Software (Optional)
              </span>
              <span className="text-[11px] text-zinc-400">
                Pipeline preferences. Creators may also utilize equivalent certified software
              </span>
            </div>
            {recommendations.suggestedTools.some((t) => !data.preferredTools?.includes(t)) && (
              <button
                type="button"
                onClick={handleAddAllSuggestedTools}
                className="text-[11px] text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/50 px-2.5 py-1 rounded-md cursor-pointer transition-colors"
              >
                + Add All Suggested Tools
              </button>
            )}
          </div>

          {/* Suggested Tools */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-mono text-purple-400/90 mr-1">✦ Suggested:</span>
            {recommendations.suggestedTools.map((tool) => {
              const isSelected = data.preferredTools?.includes(tool);
              return (
                <button
                  key={tool}
                  type="button"
                  onClick={() => handleToggleTool(tool)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors border cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-medium shadow-sm ring-1 ring-purple-500/50'
                      : 'bg-zinc-900/90 text-purple-300/90 border-purple-800/50 hover:border-purple-600 hover:text-white'
                  }`}
                >
                  <span className="text-[10px]">{isSelected ? '✓' : '+'}</span>
                  <span>{tool}</span>
                </button>
              );
            })}
          </div>

          {/* Other Platform Tools */}
          {otherTools.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center pt-1">
              <span className="text-[11px] text-zinc-500 mr-1">Other Tools:</span>
              {otherTools.map((tool) => {
                const isSelected = data.preferredTools?.includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => handleToggleTool(tool)}
                    className={`px-2 py-0.5 rounded-md text-[11px] transition-colors border cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/25 border-purple-500 text-purple-200 font-medium'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {isSelected ? `✓ ${tool}` : tool}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Disclaimer Note */}
        <div className="pt-2 border-t border-zinc-850/80 text-[11px] text-zinc-500 flex items-start sm:items-center gap-2">
          <span className="text-purple-400/80">ℹ</span>
          <span>{RECOMMENDATIONS_DISCLAIMER}</span>
        </div>
      </section>

      {/* SECTION 4: Usage Rights & Guidelines */}
      <section className="p-6 sm:p-7 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm flex flex-col gap-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/70 border border-purple-800/60 px-2 py-0.5 rounded">
              04
            </span>
            <span>Usage Rights & Guidelines</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="commercialUsage" className="text-xs font-medium text-zinc-300 flex items-center justify-between">
              <span>Commercial Rights License *</span>
              {unansweredAIFields?.includes('commercialUsage') && !data.commercialUsage && (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                  Required
                </span>
              )}
            </label>
            <select
              id="commercialUsage"
              value={data.commercialUsage}
              onChange={(e) => onChange({ ...data, commercialUsage: e.target.value as BriefCommercialUsage })}
              className={`bg-zinc-900 border text-zinc-100 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-zinc-700 cursor-pointer ${
                errors.commercialUsage ? 'border-red-500/80 focus:ring-red-500' : 'border-zinc-800'
              }`}
            >
              <option value="">Select license terms</option>
              {COMMERCIAL_LICENSES.map((lic) => (
                <option key={lic.value} value={lic.value}>
                  {lic.label} — {lic.desc}
                </option>
              ))}
            </select>
            {errors.commercialUsage && <p className="text-xs text-red-400 mt-0.5">{errors.commercialUsage}</p>}
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Terms and asset transfer are formalized in the creator contract.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="modelSafetyPolicy" className="text-xs font-medium text-zinc-300">
              Model & IP Safety Policy *
            </label>
            <select
              id="modelSafetyPolicy"
              value={data.modelSafetyPolicy}
              onChange={(e) => onChange({ ...data, modelSafetyPolicy: e.target.value as BriefModelSafetyPolicy })}
              className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-zinc-700 cursor-pointer"
            >
              {SAFETY_POLICIES.map((sp) => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Checkpoints and LoRAs permitted for project generation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Input
              label="Usage Territory *"
              placeholder="e.g. Worldwide / Global, Regional, Digital Web"
              value={data.usageTerritory}
              onChange={(e) => onChange({ ...data, usageTerritory: e.target.value })}
              error={errors.usageTerritory}
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-zinc-500">Presets:</span>
              {TERRITORY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChange({ ...data, usageTerritory: preset })}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors border cursor-pointer ${
                    data.usageTerritory === preset
                      ? 'bg-purple-600/25 border-purple-500 text-purple-200 font-medium'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Input
              label="Usage Duration *"
              placeholder="e.g. Perpetual, 1 Year, 6 Months"
              value={data.usageDuration}
              onChange={(e) => onChange({ ...data, usageDuration: e.target.value })}
              error={errors.usageDuration}
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-zinc-500">Presets:</span>
              {DURATION_TAG_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChange({ ...data, usageDuration: preset })}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors border cursor-pointer ${
                    data.usageDuration === preset
                      ? 'bg-purple-600/25 border-purple-500 text-purple-200 font-medium'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Budget & Timeline (₹ INR) */}
      <section className="p-6 sm:p-7 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm flex flex-col gap-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/70 border border-purple-800/60 px-2 py-0.5 rounded">
              05
            </span>
            <span>Budget & Timeline (₹ INR)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <Input
              label="Minimum Budget (₹) *"
              type="number"
              min={0}
              step={1000}
              placeholder="e.g. 50000"
              value={data.budgetMin}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ ...data, budgetMin: val === '' ? '' : Number(val) });
              }}
              error={errors.budgetMin}
            />
            {unansweredAIFields?.includes('budget') && (data.budgetMin === '' || data.budgetMin === null) && (
              <span className="text-[11px] font-mono text-amber-400">
                ⚠️ Required
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Maximum Budget (₹) *"
              type="number"
              min={1000}
              step={1000}
              placeholder="e.g. 150000"
              value={data.budgetMax}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ ...data, budgetMax: val === '' ? '' : Number(val) });
              }}
              error={errors.budgetMax}
            />
            {unansweredAIFields?.includes('budget') && (data.budgetMax === '' || data.budgetMax === null) && (
              <span className="text-[11px] font-mono text-amber-400">
                ⚠️ Required
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Delivery Deadline *"
              type="date"
              value={data.deadline}
              onChange={(e) => onChange({ ...data, deadline: e.target.value })}
              error={errors.deadline}
            />
            {unansweredAIFields?.includes('deadline') && !data.deadline && (
              <span className="text-[11px] font-mono text-amber-400">
                ⚠️ Required
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="constraints" className="text-xs font-medium text-zinc-300">
              Negative Constraints (Optional)
            </label>
            <textarea
              id="constraints"
              rows={2}
              placeholder="e.g. Avoid oversaturated neon, distorted hands, or AI morphing artifacting between cuts."
              value={data.creativeConstraints}
              onChange={(e) => onChange({ ...data, creativeConstraints: e.target.value })}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-zinc-700"
            />
          </div>

          <Input
            label="Moodboard & Reference Links (Optional)"
            placeholder="e.g. https://figma.com/... or https://pinterest.com/..."
            value={data.referenceLinks}
            onChange={(e) => onChange({ ...data, referenceLinks: e.target.value })}
          />
        </div>
      </section>

      {/* Floating Action Bar */}
      <div className="sticky bottom-4 sm:bottom-6 z-30 px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/90" />
          <span>Local draft auto-saved in browser</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onSaveDraft}
            className="flex-1 sm:flex-none border-zinc-700/80 hover:border-zinc-500"
          >
            Save Draft
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onProceedToReview}
            className="flex-1 sm:flex-none shadow-md shadow-purple-600/20"
          >
            Review Brief Details →
          </Button>
        </div>
      </div>
    </div>
  );
}
