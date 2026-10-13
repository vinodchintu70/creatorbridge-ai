import type { ProvenanceTier, VerificationEvidence } from '@/types/creator';

export interface ProvenanceDetails {
  tier: ProvenanceTier;
  label: string;
  badgeVariant: 'default' | 'verified' | 'warning' | 'accent' | 'outline';
  badgeIcon: string;
  isVerified: boolean;
  shortDescription: string;
  explanation: string;
}

/**
 * Standard honest definitions for all four CreatorBridge provenance classifications.
 */
export const PROVENANCE_DEFINITIONS: Record<ProvenanceTier, ProvenanceDetails> = {
  demo_evidence: {
    tier: 'demo_evidence',
    label: 'Demo Evidence',
    badgeVariant: 'accent',
    badgeIcon: '⚡',
    isVerified: false,
    shortDescription: 'Simulated data for demonstration',
    explanation: 'Simulated production pipeline, seeds, and node lineage created for demonstration purposes.',
  },
  self_reported: {
    tier: 'self_reported',
    label: 'Self-Reported',
    badgeVariant: 'warning',
    badgeIcon: '⚠',
    isVerified: false,
    shortDescription: 'Creator-provided claim not independently checked',
    explanation: 'Creator-submitted claims and metrics that have not been independently audited or verified by CreatorBridge.',
  },
  external_linked: {
    tier: 'external_linked',
    label: 'External Evidence Linked',
    badgeVariant: 'outline',
    badgeIcon: '🔗',
    isVerified: false,
    shortDescription: 'External reference provided; not independently verified',
    explanation: 'A reference link is provided by the creator, but has not been independently checked or audited by CreatorBridge.',
  },
  verified: {
    tier: 'verified',
    label: 'Verified Evidence',
    badgeVariant: 'verified',
    badgeIcon: '✓',
    isVerified: true,
    shortDescription: 'Independently audited with supporting evidence',
    explanation: 'Verified through an existing, real verification process and documented supporting evidence.',
  },
};

/**
 * Resolves full provenance metadata and honest badges for any verification record.
 */
export function getProvenanceDetails(evidence?: VerificationEvidence | null): ProvenanceDetails {
  if (!evidence) {
    return PROVENANCE_DEFINITIONS.self_reported;
  }

  const tier: ProvenanceTier =
    evidence.provenanceTier ||
    (evidence.status === 'verified' ? 'demo_evidence' : 'self_reported');

  return PROVENANCE_DEFINITIONS[tier] || PROVENANCE_DEFINITIONS.demo_evidence;
}

/**
 * Enforces strict honesty: prevents unsupported verification claims.
 * A creator cannot be classified as 'verified' if the claim relies on mock,
 * simulated, or unvetted data.
 */
export function validateProvenanceIntegrity(evidence: VerificationEvidence): {
  isValid: boolean;
  errorMessage?: string;
} {
  if (evidence.provenanceTier === 'verified') {
    if (evidence.status !== 'verified') {
      return {
        isValid: false,
        errorMessage: 'Classification mismatch: provenanceTier "verified" requires status "verified".',
      };
    }

    const detail = (evidence.evidenceDetail || '').toLowerCase();
    if (
      detail.includes('simulated') ||
      detail.includes('demo') ||
      detail.includes('specimen') ||
      detail.includes('mock') ||
      detail.length === 0
    ) {
      return {
        isValid: false,
        errorMessage: 'Integrity rule violation: simulated demonstration data cannot claim Verified status.',
      };
    }
  }

  return { isValid: true };
}
