import type {
  AITool,
  CreatorSpecialization,
  ContentType,
  AspectRatio,
  CommercialSuitability,
  CreatorFilterState,
} from '@/types/creator';

export const VALID_TOOLS: readonly AITool[] = [
  'Flux.1 Dev',
  'Runway Gen-3',
  'Midjourney v6',
  'ComfyUI',
  'Kling 1.5',
  'ElevenLabs',
  'Suno',
  'Luma Dream Machine',
  'Stable Diffusion XL',
];

export const VALID_SPECIALIZATIONS: readonly CreatorSpecialization[] = [
  'AI Commercials',
  'Generative Animation',
  'Virtual Influencers',
  'Product VFX',
  'Cinematic Worldbuilding',
  'Fashion & Editorial',
];

export const VALID_CONTENT_TYPES: readonly ContentType[] = [
  'Video',
  'Animation',
  'Still Image',
  '3D Asset',
];

export const VALID_ASPECT_RATIOS: readonly AspectRatio[] = [
  '16:9 Landscape',
  '9:16 Vertical',
  '1:1 Square',
  '2.39:1 Cinemascope',
];

export const VALID_COMMERCIAL_LICENSES: readonly CommercialSuitability[] = [
  'Full IP Buyout',
  'Exclusive Commercial',
  'Standard Agency',
  'Restricted Editorial',
];

export const DEFAULT_FILTER_STATE: CreatorFilterState = {
  search: '',
  tools: [],
  specializations: [],
  contentTypes: [],
  aspectRatios: [],
  commercialLicense: 'all',
  verifiedOnly: false,
};

// Helper to convert inputs into URLSearchParams safely
function toSearchParams(input?: URLSearchParams | string): URLSearchParams {
  if (!input) return new URLSearchParams();
  if (typeof input === 'string') {
    const qIndex = input.indexOf('?');
    const queryString = qIndex !== -1 ? input.slice(qIndex + 1) : input;
    return new URLSearchParams(queryString);
  }
  return new URLSearchParams(input.toString());
}

/**
 * Case-insensitive match against a canonical whitelist.
 */
function findCanonicalMatch<T extends string>(
  raw: string,
  validList: readonly T[]
): T | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return validList.find((item) => item.toLowerCase() === trimmed.toLowerCase());
}

/**
 * Parses URL search parameters into a validated CreatorFilterState.
 * Strips unknown, invalid, or duplicated items safely.
 * Performs case-insensitive matching to canonical names.
 */
export function parseFiltersFromSearchParams(
  input?: URLSearchParams | string
): CreatorFilterState {
  const params = toSearchParams(input);

  // 1. Search Query
  const search = params.get('search') || params.get('q') || '';

  // 2. Tools
  const rawToolsStr = params.get('tools') || params.get('tool') || '';
  const tools: AITool[] = rawToolsStr
    ? (Array.from(
        new Set(
          rawToolsStr
            .split(',')
            .map((t) => findCanonicalMatch(t, VALID_TOOLS))
            .filter((t): t is AITool => Boolean(t))
        )
      ) as AITool[])
    : [];

  // 3. Specializations
  const rawSpecsStr =
    params.get('specializations') ||
    params.get('specialization') ||
    params.get('focus') ||
    '';
  const specializations: CreatorSpecialization[] = rawSpecsStr
    ? (Array.from(
        new Set(
          rawSpecsStr
            .split(',')
            .map((s) => findCanonicalMatch(s, VALID_SPECIALIZATIONS))
            .filter((s): s is CreatorSpecialization => Boolean(s))
        )
      ) as CreatorSpecialization[])
    : [];

  // 4. Content Types (Formats)
  const rawFormatsStr =
    params.get('formats') ||
    params.get('format') ||
    params.get('contentTypes') ||
    params.get('contentType') ||
    '';
  const contentTypes: ContentType[] = rawFormatsStr
    ? (Array.from(
        new Set(
          rawFormatsStr
            .split(',')
            .map((f) => findCanonicalMatch(f, VALID_CONTENT_TYPES))
            .filter((f): f is ContentType => Boolean(f))
        )
      ) as ContentType[])
    : [];

  // 5. Aspect Ratios
  const rawRatiosStr =
    params.get('ratios') ||
    params.get('ratio') ||
    params.get('aspectRatios') ||
    params.get('aspectRatio') ||
    '';
  const aspectRatios: AspectRatio[] = rawRatiosStr
    ? (Array.from(
        new Set(
          rawRatiosStr
            .split(',')
            .map((r) => findCanonicalMatch(r, VALID_ASPECT_RATIOS))
            .filter((r): r is AspectRatio => Boolean(r))
        )
      ) as AspectRatio[])
    : [];

  // 6. Commercial License
  const rawCommercial =
    params.get('commercial') ||
    params.get('commercialLicense') ||
    params.get('license') ||
    params.get('usage') ||
    '';
  const matchedCommercial = rawCommercial
    ? findCanonicalMatch(rawCommercial, VALID_COMMERCIAL_LICENSES)
    : undefined;
  const commercialLicense: CommercialSuitability | 'all' = matchedCommercial || 'all';

  // 7. Verified Only
  const rawVerified = (
    params.get('verified') ||
    params.get('verifiedOnly') ||
    ''
  ).toLowerCase().trim();
  const verifiedOnly = rawVerified === 'true' || rawVerified === '1' || rawVerified === 'yes';

  return {
    search: search.trim(),
    tools,
    specializations,
    contentTypes,
    aspectRatios,
    commercialLicense,
    verifiedOnly,
  };
}

/**
 * Checks whether two filter states are semantically equivalent.
 */
export function areFiltersEqual(
  a: CreatorFilterState,
  b: CreatorFilterState
): boolean {
  if (a.search.trim() !== b.search.trim()) return false;
  if (a.commercialLicense !== b.commercialLicense) return false;
  if (Boolean(a.verifiedOnly) !== Boolean(b.verifiedOnly)) return false;

  const compareArrays = (arrA: string[], arrB: string[]) => {
    if (arrA.length !== arrB.length) return false;
    const sortedA = [...arrA].sort();
    const sortedB = [...arrB].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  };

  if (!compareArrays(a.tools, b.tools)) return false;
  if (!compareArrays(a.specializations, b.specializations)) return false;
  if (!compareArrays(a.contentTypes, b.contentTypes)) return false;
  if (!compareArrays(a.aspectRatios, b.aspectRatios)) return false;

  return true;
}

/**
 * Checks whether a filter state is the default / initial state (no active filters).
 */
export function isInitialFilterState(filters: CreatorFilterState): boolean {
  return (
    !filters.search.trim() &&
    filters.tools.length === 0 &&
    filters.specializations.length === 0 &&
    filters.contentTypes.length === 0 &&
    filters.aspectRatios.length === 0 &&
    (filters.commercialLicense === 'all' || !filters.commercialLicense) &&
    !filters.verifiedOnly
  );
}

export interface EncodeOptions {
  existingParams?: URLSearchParams | string;
  creatorId?: string | null;
}

const MANAGED_FILTER_KEYS = [
  'search',
  'q',
  'tools',
  'tool',
  'specializations',
  'specialization',
  'focus',
  'formats',
  'format',
  'contentTypes',
  'contentType',
  'ratios',
  'ratio',
  'aspectRatios',
  'aspectRatio',
  'commercial',
  'commercialLicense',
  'license',
  'usage',
  'verified',
  'verifiedOnly',
];

/**
 * Encodes a CreatorFilterState into URLSearchParams, preserving unrelated parameters
 * and maintaining the creator deep-link parameter as specified.
 */
export function encodeFiltersToSearchParams(
  filters: CreatorFilterState,
  options?: EncodeOptions
): URLSearchParams {
  const result = toSearchParams(options?.existingParams);

  // Clean out previously managed filter keys to avoid stale or duplicated entries
  for (const key of MANAGED_FILTER_KEYS) {
    result.delete(key);
  }

  // Handle creator parameter override if explicitly provided
  if (options?.creatorId !== undefined) {
    if (options.creatorId) {
      result.set('creator', options.creatorId);
    } else {
      result.delete('creator');
    }
  }

  // Encode active filters deterministically
  if (filters.search && filters.search.trim()) {
    result.set('search', filters.search.trim());
  }

  if (filters.tools && filters.tools.length > 0) {
    const valid = Array.from(new Set(filters.tools))
      .filter((t) => (VALID_TOOLS as readonly string[]).includes(t))
      .sort();
    if (valid.length > 0) {
      result.set('tools', valid.join(','));
    }
  }

  if (filters.specializations && filters.specializations.length > 0) {
    const valid = Array.from(new Set(filters.specializations))
      .filter((s) => (VALID_SPECIALIZATIONS as readonly string[]).includes(s))
      .sort();
    if (valid.length > 0) {
      result.set('specializations', valid.join(','));
    }
  }

  if (filters.contentTypes && filters.contentTypes.length > 0) {
    const valid = Array.from(new Set(filters.contentTypes))
      .filter((f) => (VALID_CONTENT_TYPES as readonly string[]).includes(f))
      .sort();
    if (valid.length > 0) {
      result.set('formats', valid.join(','));
    }
  }

  if (filters.aspectRatios && filters.aspectRatios.length > 0) {
    const valid = Array.from(new Set(filters.aspectRatios))
      .filter((r) => (VALID_ASPECT_RATIOS as readonly string[]).includes(r))
      .sort();
    if (valid.length > 0) {
      result.set('ratios', valid.join(','));
    }
  }

  if (
    filters.commercialLicense &&
    filters.commercialLicense !== 'all' &&
    (VALID_COMMERCIAL_LICENSES as readonly string[]).includes(filters.commercialLicense)
  ) {
    result.set('commercial', filters.commercialLicense);
  }

  if (filters.verifiedOnly) {
    result.set('verified', 'true');
  }

  return result;
}

/**
 * Builds a clean relative pathname with query string for the creators page.
 */
export function buildCreatorFilterUrl(
  filters: CreatorFilterState,
  options?: EncodeOptions
): string {
  const searchParams = encodeFiltersToSearchParams(filters, options);
  const query = searchParams.toString();
  return query ? `/creators?${query}` : '/creators';
}
