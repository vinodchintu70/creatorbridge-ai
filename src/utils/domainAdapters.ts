import type {
  BriefContentType,
  BriefCommercialUsage,
} from '@/types/brief';
import type {
  ContentType,
  CommercialSuitability,
} from '@/types/creator';

/**
 * Standard legal notice applied to all commercial usage rights adapters.
 * Never promises or implies that platform tags constitute legal warranty or IP ownership.
 */
export const COMMERCIAL_USAGE_LEGAL_NOTICE =
  'IMPORTANT LEGAL NOTICE: Listed creator commercial suitability represents profile parameters and typical licensing availability. It does NOT constitute a warranty of non-infringement or guaranteed copyright clearance. Final usage rights, asset transfer, and licensing terms must be formalized directly in the project agreement executed between brand and creator.';

/**
 * Canonical bidirectional mapping between brief content types and creator portfolio content formats.
 */
export const BRIEF_TO_PORTFOLIO_CONTENT_TYPE: Record<BriefContentType, ContentType> = {
  'Brand Commercial Video': 'Video',
  'Social Video Reel / UGC': 'Video',
  '3D Product VFX': '3D Asset',
  'Key Visual Still': 'Still Image',
  'Virtual Persona Asset': 'Still Image',
  'Generative Animation': 'Animation',
};

export const PORTFOLIO_TO_BRIEF_CONTENT_TYPES: Record<ContentType, BriefContentType[]> = {
  Video: ['Brand Commercial Video', 'Social Video Reel / UGC'],
  Animation: ['Generative Animation'],
  'Still Image': ['Key Visual Still', 'Virtual Persona Asset'],
  '3D Asset': ['3D Product VFX'],
};

/**
 * Canonical mapping between brief commercial usage options and creator commercial suitability tiers.
 */
export const BRIEF_USAGE_TO_COMMERCIAL_SUITABILITY: Record<
  Exclude<BriefCommercialUsage, ''>,
  CommercialSuitability
> = {
  'Full Global IP Buyout': 'Full IP Buyout',
  '1-Year Digital Exclusive': 'Exclusive Commercial',
  'Standard Agency License': 'Standard Agency',
  'Restricted Social Use': 'Standard Agency',
};

export const COMMERCIAL_SUITABILITY_TO_BRIEF_USAGE: Record<
  CommercialSuitability,
  Exclude<BriefCommercialUsage, ''>
> = {
  'Full IP Buyout': 'Full Global IP Buyout',
  'Exclusive Commercial': '1-Year Digital Exclusive',
  'Standard Agency': 'Standard Agency License',
  'Restricted Editorial': 'Restricted Social Use',
};

/**
 * Hierarchical licensing rank for compatibility evaluation.
 * Higher ranks satisfy equal or lower requirements.
 */
const SUITABILITY_RANK: Record<CommercialSuitability, number> = {
  'Full IP Buyout': 4,
  'Exclusive Commercial': 3,
  'Standard Agency': 2,
  'Restricted Editorial': 1,
};

const BRIEF_USAGE_MIN_RANK: Record<Exclude<BriefCommercialUsage, ''>, number> = {
  'Full Global IP Buyout': 4,
  '1-Year Digital Exclusive': 3,
  'Standard Agency License': 2,
  'Restricted Social Use': 2,
};

// -----------------------------------------------------------------------------
// Format Adapters
// -----------------------------------------------------------------------------

/**
 * Maps a BriefContentType to the corresponding creator portfolio ContentType.
 * Returns null if the value is unmapped, empty, or unrecognized.
 */
export function mapBriefContentTypeToPortfolioFormat(
  briefType?: BriefContentType | string | null
): ContentType | null {
  if (!briefType || typeof briefType !== 'string') return null;
  if (briefType in BRIEF_TO_PORTFOLIO_CONTENT_TYPE) {
    return BRIEF_TO_PORTFOLIO_CONTENT_TYPE[briefType as BriefContentType];
  }
  return null;
}

/**
 * Maps a creator portfolio ContentType to an array of matching BriefContentTypes.
 * Returns an empty array if the format is unmapped, empty, or unrecognized.
 */
export function mapPortfolioFormatToBriefFormats(
  portfolioType?: ContentType | string | null
): BriefContentType[] {
  if (!portfolioType || typeof portfolioType !== 'string') return [];
  if (portfolioType in PORTFOLIO_TO_BRIEF_CONTENT_TYPES) {
    return PORTFOLIO_TO_BRIEF_CONTENT_TYPES[portfolioType as ContentType];
  }
  return [];
}

/**
 * Checks whether a creator's portfolio formats satisfy a given brief content type.
 */
export function isPortfolioFormatCompatible(
  portfolioFormats: (ContentType | string)[] | undefined | null,
  briefType?: BriefContentType | string | null
): boolean {
  if (!portfolioFormats || !Array.isArray(portfolioFormats) || portfolioFormats.length === 0) {
    return false;
  }
  const targetFormat = mapBriefContentTypeToPortfolioFormat(briefType);
  if (!targetFormat) return false;

  return portfolioFormats.includes(targetFormat);
}

// -----------------------------------------------------------------------------
// Usage Rights & Licensing Adapters
// -----------------------------------------------------------------------------

/**
 * Maps a BriefCommercialUsage to the corresponding creator CommercialSuitability tier.
 * Returns null if empty, unrecognized, or unspecified.
 */
export function mapBriefUsageToCommercialSuitability(
  briefUsage?: BriefCommercialUsage | string | null
): CommercialSuitability | null {
  if (!briefUsage || typeof briefUsage !== 'string') return null;
  if (briefUsage in BRIEF_USAGE_TO_COMMERCIAL_SUITABILITY) {
    return BRIEF_USAGE_TO_COMMERCIAL_SUITABILITY[briefUsage as Exclude<BriefCommercialUsage, ''>];
  }
  return null;
}

/**
 * Maps a creator CommercialSuitability tier to a corresponding default BriefCommercialUsage option.
 * Returns null if unrecognized or invalid.
 */
export function mapCommercialSuitabilityToBriefUsage(
  suitability?: CommercialSuitability | string | null
): Exclude<BriefCommercialUsage, ''> | null {
  if (!suitability || typeof suitability !== 'string') return null;
  if (suitability in COMMERCIAL_SUITABILITY_TO_BRIEF_USAGE) {
    return COMMERCIAL_SUITABILITY_TO_BRIEF_USAGE[suitability as CommercialSuitability];
  }
  return null;
}

/**
 * Evaluates whether a creator's commercial suitability rank meets or exceeds
 * the licensing level requested in the brief.
 *
 * Example: A creator offering "Full IP Buyout" (Rank 4) is compatible with a brief
 * requesting "Standard Agency License" (Rank 2).
 * Conversely, a creator limited to "Restricted Editorial" (Rank 1) is NOT compatible.
 */
export function isCreatorSuitabilityCompatible(
  creatorSuitability?: CommercialSuitability | string | null,
  briefUsage?: BriefCommercialUsage | string | null
): boolean {
  if (!creatorSuitability || typeof creatorSuitability !== 'string') return false;
  if (!briefUsage || typeof briefUsage !== 'string' || briefUsage.trim() === '') return false;

  const creatorRank = SUITABILITY_RANK[creatorSuitability as CommercialSuitability];
  const requiredRank = BRIEF_USAGE_MIN_RANK[briefUsage as Exclude<BriefCommercialUsage, ''>];

  if (!creatorRank || !requiredRank) return false;

  return creatorRank >= requiredRank;
}

export interface CommercialLicensingGuidance {
  briefUsage: BriefCommercialUsage;
  mappedSuitability: CommercialSuitability | null;
  description: string;
  legalNotice: string;
}

/**
 * Returns structured licensing guidance for brief review and creator matching views.
 */
export function getCommercialLicensingGuidance(
  briefUsage?: BriefCommercialUsage | string | null
): CommercialLicensingGuidance {
  const safeUsage = (briefUsage as BriefCommercialUsage) || '';
  const mapped = mapBriefUsageToCommercialSuitability(safeUsage);

  let description = 'Commercial usage rights not specified.';
  if (safeUsage === 'Full Global IP Buyout') {
    description = 'Full commercial transfer of project intellectual property rights upon completion.';
  } else if (safeUsage === '1-Year Digital Exclusive') {
    description = 'Exclusive digital marketing license for a duration of 12 months.';
  } else if (safeUsage === 'Standard Agency License') {
    description = 'Standard marketing license for agency client campaigns across digital channels.';
  } else if (safeUsage === 'Restricted Social Use') {
    description = 'Restricted licensing limited strictly to social media marketing channels.';
  }

  return {
    briefUsage: safeUsage,
    mappedSuitability: mapped,
    description,
    legalNotice: COMMERCIAL_USAGE_LEGAL_NOTICE,
  };
}
