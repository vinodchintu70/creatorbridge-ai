'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { creatorService } from '@/services/creatorService';

// Layout and styling slots for canonical creators showcased on hero
const HERO_PREVIEW_SLOTS = [
  {
    creatorId: 'creator-1',
    rotationClass: '-rotate-6 hover:rotate-0',
    positionClasses: 'hidden lg:block lg:absolute lg:top-4 lg:-left-4 xl:-left-12 lg:w-64',
  },
  {
    creatorId: 'creator-2',
    rotationClass: 'rotate-3 hover:rotate-0',
    positionClasses: 'hidden lg:block lg:absolute lg:bottom-4 lg:-left-6 xl:-left-16 lg:w-64',
  },
  {
    creatorId: 'creator-3',
    rotationClass: 'rotate-6 hover:rotate-0',
    positionClasses: 'hidden lg:block lg:absolute lg:top-4 lg:-right-4 xl:-right-12 lg:w-64',
  },
  {
    creatorId: 'creator-4',
    rotationClass: '-rotate-3 hover:rotate-0',
    positionClasses: 'hidden lg:block lg:absolute lg:bottom-4 lg:-right-6 xl:-right-16 lg:w-64',
  },
];

const SEARCH_SUGGESTIONS = [
  { label: 'Product Videos', query: 'Product Videos' },
  { label: 'AI Art', query: 'AI Art' },
  { label: 'Social Ads', query: 'Social Ads' },
  { label: 'Cinematic 3D', query: 'Worldbuilding' },
  { label: 'Virtual Influencers', query: 'Influencers' },
];

const HOW_IT_WORKS_STEPS = [
  {
    number: '01',
    title: 'Discover AI Talent',
    description:
      'Search verified creators specialized in Runway Gen-3, Flux.1, Midjourney, and custom ComfyUI pipelines.',
    badge: 'Verified Lineage',
  },
  {
    number: '02',
    title: 'Inspect Generation Recipes',
    description:
      'Review seeds, LoRA weights, and node pipelines to ensure repeatability before hiring.',
    badge: 'Transparent Proof',
  },
  {
    number: '03',
    title: 'Launch Structured Briefs',
    description:
      'Publish requirements with defined deliverables, formats, and commercial IP buyout rights.',
    badge: 'Commercial Clearance',
  },
];

const CATEGORIES = [
  {
    title: 'AI Commercials & Ads',
    query: 'AI Commercials',
    description: 'High-production 15s–60s cinematic brand videos with camera motion control.',
    sampleImage: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=600&q=80',
    tools: ['Runway Gen-3', 'Flux.1 Dev'],
  },
  {
    title: 'Product VFX & Stills',
    query: 'Product VFX',
    description: 'Studio-grade hardware, beverage, and luxury packaging renders from CAD constraints.',
    sampleImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    tools: ['ComfyUI', 'Flux.1 Dev'],
  },
  {
    title: 'Generative Animation',
    query: 'Generative Animation',
    description: 'Stylized motion narratives, kinetic typography, and audio-reactive visuals.',
    sampleImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    tools: ['Kling 1.5', 'ElevenLabs'],
  },
  {
    title: 'Cinematic Worldbuilding',
    query: 'Cinematic Worldbuilding',
    description: 'Deep sci-fi environments, monumental architectural concepts, and matte plates.',
    sampleImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    tools: ['Flux.1 Dev', 'Midjourney v6'],
  },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamically resolve hero preview cards from canonical creator data
  const heroPreviews = useMemo(() => {
    return HERO_PREVIEW_SLOTS.map((slot) => {
      const creator = creatorService.getCreatorById(slot.creatorId);
      if (!creator) return null;
      const project = creator.portfolio?.[0];
      return {
        creatorId: creator.id,
        creatorName: creator.name,
        handle: creator.handle,
        avatarUrl: creator.avatarUrl,
        projectTitle: project?.title || 'Sample Project',
        thumbnailUrl: project?.thumbnailUrl || creator.avatarUrl,
        primaryTool: project?.workflow?.primaryModel || creator.primaryTools[0] || 'AI Model',
        format: project?.aspectRatio ? project.aspectRatio.split(' ')[0] : '16:9',
        provenanceTag:
          creator.verification.provenanceTier === 'demo_evidence'
            ? 'Demo Specimen'
            : 'Verified Partner',
        rotationClass: slot.rotationClass,
        positionClasses: slot.positionClasses,
      };
    }).filter(Boolean) as Array<{
      creatorId: string;
      creatorName: string;
      handle: string;
      avatarUrl: string;
      projectTitle: string;
      thumbnailUrl: string;
      primaryTool: string;
      format: string;
      provenanceTag: string;
      rotationClass: string;
      positionClasses: string;
    }>;
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/creators?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/creators');
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#0b0c10] text-zinc-100 overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative w-full py-16 sm:py-20 md:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 border-b border-zinc-800/60 overflow-hidden bg-gradient-to-b from-[#131520] via-[#0b0c10] to-[#0a0a0f]">
        {/* Subtle Ambient Radial Lighting */}
        <div
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] sm:w-[900px] h-[500px] bg-gradient-to-tr from-purple-600/15 via-indigo-500/15 to-cyan-500/10 blur-3xl opacity-75"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-1/2 left-10 w-72 h-72 bg-purple-600/10 blur-[100px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-1/2 right-10 w-72 h-72 bg-blue-600/10 blur-[100px]"
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto">
          {/* Desktop Tilted Floating Cards Surrounding Hero (Genuinely Interactive) */}
          {heroPreviews.map((card) => (
            <Link
              key={card.creatorId}
              href={`/creators?creator=${card.creatorId}`}
              className={`${card.positionClasses} z-10 transition-all duration-300 transform-gpu ${card.rotationClass} hover:scale-105 hover:z-20 motion-reduce:transform-none motion-reduce:transition-none group block focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-xl cursor-pointer`}
              aria-label={`View ${card.creatorName}'s profile and AI portfolio`}
            >
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/90 group-hover:border-purple-500/50 shadow-2xl shadow-purple-950/20 backdrop-blur-md transition-colors">
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-950">
                  <Image
                    src={card.thumbnailUrl}
                    alt={card.projectTitle}
                    fill
                    sizes="260px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-zinc-950/80 backdrop-blur text-[9px] font-medium text-zinc-300 border border-zinc-800">
                    {card.provenanceTag}
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-zinc-700">
                      <Image
                        src={card.avatarUrl}
                        alt={card.creatorName}
                        fill
                        sizes="24px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate leading-tight group-hover:text-purple-300 transition-colors">
                        {card.creatorName}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">{card.handle}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                    {card.primaryTool}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* Central Hero Column */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto px-2">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-medium mb-6 backdrop-blur">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>Applied AI Creator Marketplace</span>
              <span className="text-purple-400/60">•</span>
              <span className="text-zinc-400 font-mono text-[11px]">Kampus.VC</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.03em] sm:tracking-[-0.035em] text-white leading-[1.12] sm:leading-[1.08] max-w-4xl mx-auto text-balance">
              Find{' '}
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent font-extrabold">
                AI Creators
              </span>{' '}
              to Bring Your Ideas to Life
            </h1>

            {/* Subtitle */}
            <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-zinc-400 font-normal leading-relaxed max-w-2xl mx-auto text-balance">
              Discover creative talent, explore how their work is made, and find the right creator
              for your next campaign.
            </p>

            {/* Prominent Centered Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-8 sm:mt-10 w-full max-w-2xl relative"
              role="search"
              aria-label="Search AI Creators"
            >
              <div className="flex items-center bg-zinc-900/90 border border-zinc-700/80 rounded-full p-1.5 shadow-xl shadow-black/40 backdrop-blur transition-all duration-200 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/25">
                <div className="pl-3.5 pr-2 text-zinc-400" aria-hidden="true">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What do you want to create? Try product videos, AI art, or social ads..."
                  className="w-full bg-transparent text-sm sm:text-base text-zinc-100 placeholder:text-zinc-500 font-normal focus:outline-none px-1"
                />
                <button
                  type="submit"
                  className="shrink-0 px-5 sm:px-6 py-2.5 rounded-full text-sm font-semibold tracking-normal text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md shadow-purple-500/25 active:scale-95 cursor-pointer"
                >
                  Search
                </button>
              </div>

              {/* Quick Search Suggestions */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-zinc-400">
                <span className="text-zinc-500 font-medium">Popular:</span>
                {SEARCH_SUGGESTIONS.map((s) => (
                  <Link
                    key={s.label}
                    href={`/creators?search=${encodeURIComponent(s.query)}`}
                    className="px-2.5 py-1 rounded-full bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 font-medium transition-colors"
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </form>

            {/* Two Primary CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
              <Link href="/creators" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-base tracking-normal shadow-lg shadow-purple-600/30 px-8"
                >
                  Explore Creators
                </Button>
              </Link>
              <Link href="/briefs/new" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-zinc-700 hover:border-zinc-500 hover:bg-zinc-850 text-zinc-200 font-semibold text-base tracking-normal px-8"
                >
                  Create a Brief
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile & Tablet Preview Cards Ribbon */}
          <div className="mt-12 lg:hidden">
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider text-center mb-3">
              Specimen Portfolio Showcases
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {heroPreviews.map((card) => (
                <Link
                  key={`mobile-${card.creatorId}`}
                  href={`/creators?creator=${card.creatorId}`}
                  className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-purple-500/50 shadow-md backdrop-blur flex flex-col gap-2 transition-all cursor-pointer group"
                  aria-label={`View ${card.creatorName}'s profile and AI portfolio`}
                >
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-950">
                    <Image
                      src={card.thumbnailUrl}
                      alt={card.projectTitle}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-zinc-950/80 backdrop-blur text-[9px] font-medium text-zinc-300 border border-zinc-800">
                      {card.provenanceTag}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-zinc-700">
                        <Image
                          src={card.avatarUrl}
                          alt={card.creatorName}
                          fill
                          sizes="24px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                          {card.creatorName}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">{card.projectTitle}</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono shrink-0">
                      {card.primaryTool}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Live Marketplace Highlights Bar */}
        <div className="mt-14 sm:mt-16 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur">
          <div className="p-2 sm:p-3">
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">100%</div>
            <div className="text-xs sm:text-sm text-zinc-400 font-normal mt-1">Documented Lineages</div>
          </div>
          <div className="p-2 sm:p-3">
            <div className="text-xl sm:text-2xl font-bold text-purple-400 tracking-tight">Seeds</div>
            <div className="text-xs sm:text-sm text-zinc-400 font-normal mt-1">Transparent Model Recipes</div>
          </div>
          <div className="p-2 sm:p-3">
            <div className="text-xl sm:text-2xl font-bold text-blue-400 tracking-tight">Honest</div>
            <div className="text-xs sm:text-sm text-zinc-400 font-normal mt-1">Demo vs Audited Tiers</div>
          </div>
          <div className="p-2 sm:p-3">
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight">Full IP</div>
            <div className="text-xs sm:text-sm text-zinc-400 font-normal mt-1">Commercial Buyouts</div>
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS */}
      <section
        id="how-it-works"
        className="w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20"
      >
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider font-mono">
            How It Works
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mt-2">
            AI-Native Production in Three Steps
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-xl mx-auto">
            From talent discovery to repeatable generation recipes and commercial clearance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div
              key={step.number}
              className="relative p-6 sm:p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl sm:text-3xl font-bold text-purple-400/90 font-mono group-hover:text-purple-300 transition-colors">
                    {step.number}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono font-normal">
                    {step.badge}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-zinc-400 font-normal leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: POPULAR CATEGORIES */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-850">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider font-mono">
              Marketplace Disciplines
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mt-1">
              Explore Popular Creative Categories
            </h2>
          </div>
          <Link
            href="/creators"
            className="text-sm font-semibold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 group"
          >
            <span>View All Creators</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.title}
              href={`/creators?search=${encodeURIComponent(cat.query)}`}
              className="group p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-purple-500/40 hover:bg-zinc-900 transition-all duration-200 flex flex-col"
            >
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 mb-3">
                <Image
                  src={cat.sampleImage}
                  alt={cat.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors">
                {cat.title}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed line-clamp-2">
                {cat.description}
              </p>
              <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap gap-1">
                {cat.tools.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] px-2 py-0.5 rounded bg-zinc-800/90 text-zinc-300 font-mono font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 4: THE WORKFLOW ADVANTAGE */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-850">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider font-mono">
              Transparent Provenance
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mt-2">
              Why Brands Pick CreatorBridge AI
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 font-normal leading-relaxed">
              Ensure consistency and IP safety with transparent workflow recipes, documented provenance, and commercial ownership.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-white">Repeatable Model Recipes</h4>
                  <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed mt-0.5">
                    Inspect exact ComfyUI nodes, LoRA weights, negative prompts, and seeds before hiring.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-white">Honest Trust Signals</h4>
                  <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed mt-0.5">
                    Clear provenance badges explicitly separating demo specimens from audited client receipts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-white">Structured Commercial Briefs</h4>
                  <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed mt-0.5">
                    Publish requirements with strict aspect ratio specifications and full IP buyouts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Code/Workflow Recipe Visual Specimen Card */}
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="font-mono text-zinc-400 ml-2">specimen_workflow.json</span>
              </div>
              <span className="font-mono text-purple-400 text-[10px] bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Lineage Inspector
              </span>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              <div>
                <span className="text-zinc-500">primary_model:</span>{' '}
                <span className="text-purple-300">&quot;Flux.1 Dev (BF16) + Custom LoRA v2.4&quot;</span>
              </div>
              <div>
                <span className="text-zinc-500">sampler:</span>{' '}
                <span className="text-cyan-300">&quot;Euler A&quot;</span>{' '}
                <span className="text-zinc-500">| steps:</span>{' '}
                <span className="text-cyan-300">32</span>{' '}
                <span className="text-zinc-500">| cfg_scale:</span>{' '}
                <span className="text-cyan-300">3.5</span>
              </div>
              <div>
                <span className="text-zinc-500">seed:</span>{' '}
                <span className="text-emerald-400">48921045</span>
              </div>
              <div>
                <span className="text-zinc-500">pipeline_nodes:</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5 pl-3">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                    ControlNet Depth (Midas)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                    ObjectDetailer
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                    AnimateDiff Module v3
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                    Topaz 4K 60fps
                  </span>
                </div>
              </div>
              <div className="pt-2 text-zinc-400 text-[11px] font-sans border-t border-zinc-800/80">
                Consistency locked with studio lighting references across 8 camera orbit moves.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: FINAL CTA BANNER */}
      <section className="w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl p-8 sm:p-12 md:p-16 bg-gradient-to-br from-purple-950/40 via-zinc-900/90 to-zinc-950 border border-purple-500/30 text-center overflow-hidden shadow-2xl">
          <div
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/20 blur-3xl rounded-full"
            aria-hidden="true"
          />

          <h2 className="relative text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight max-w-2xl mx-auto">
            Ready to Bring Your Ideas to Life?
          </h2>
          <p className="relative mt-4 text-base sm:text-lg text-zinc-300 font-normal leading-relaxed max-w-xl mx-auto">
            Connect with top generative AI creators or publish your structured campaign brief in
            minutes.
          </p>

          <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/creators" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-base tracking-normal px-8 shadow-lg shadow-purple-600/30"
              >
                Explore Creators
              </Button>
            </Link>
            <Link href="/briefs/new" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-zinc-700 hover:border-zinc-500 text-white font-semibold text-base tracking-normal px-8"
              >
                Create a Brief
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
