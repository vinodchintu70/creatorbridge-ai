import assert from 'node:assert';
import { MOCK_CREATORS } from '../src/data/mockCreators.ts';
import {
  PROVENANCE_DEFINITIONS,
  getProvenanceDetails,
  validateProvenanceIntegrity,
} from '../src/utils/provenance.ts';
import type { VerificationEvidence } from '../src/types/creator.ts';

console.log('--- RUNNING PROVENANCE CLASSIFICATION & INTEGRITY TEST SUITE ---');

// [TEST 1] Provenance Definitions Contract
console.log('\n[TEST 1] Provenance Tier Definitions Contract (All 4 Tiers)');
assert.strictEqual(PROVENANCE_DEFINITIONS.demo_evidence.tier, 'demo_evidence');
assert.strictEqual(PROVENANCE_DEFINITIONS.demo_evidence.label, 'Demo Evidence');
assert.strictEqual(PROVENANCE_DEFINITIONS.demo_evidence.isVerified, false);
assert.strictEqual(PROVENANCE_DEFINITIONS.demo_evidence.badgeVariant, 'accent');

assert.strictEqual(PROVENANCE_DEFINITIONS.self_reported.tier, 'self_reported');
assert.strictEqual(PROVENANCE_DEFINITIONS.self_reported.label, 'Self-Reported');
assert.strictEqual(PROVENANCE_DEFINITIONS.self_reported.isVerified, false);
assert.strictEqual(PROVENANCE_DEFINITIONS.self_reported.badgeVariant, 'warning');

assert.strictEqual(PROVENANCE_DEFINITIONS.external_linked.tier, 'external_linked');
assert.strictEqual(PROVENANCE_DEFINITIONS.external_linked.label, 'External Evidence Linked');
assert.strictEqual(PROVENANCE_DEFINITIONS.external_linked.isVerified, false);
assert.strictEqual(PROVENANCE_DEFINITIONS.external_linked.badgeVariant, 'outline');

assert.strictEqual(PROVENANCE_DEFINITIONS.verified.tier, 'verified');
assert.strictEqual(PROVENANCE_DEFINITIONS.verified.label, 'Verified Evidence');
assert.strictEqual(PROVENANCE_DEFINITIONS.verified.isVerified, true);
assert.strictEqual(PROVENANCE_DEFINITIONS.verified.badgeVariant, 'verified');
console.log('✓ All 4 Provenance Tier Definitions match specifications');

// [TEST 2] getProvenanceDetails Resolution & Fallbacks
console.log('\n[TEST 2] getProvenanceDetails Resolution & Safe Fallbacks');
const nullDetails = getProvenanceDetails(null);
assert.strictEqual(nullDetails.tier, 'self_reported');
assert.strictEqual(nullDetails.isVerified, false);

const undefinedDetails = getProvenanceDetails(undefined);
assert.strictEqual(undefinedDetails.tier, 'self_reported');

const explicitExternal: VerificationEvidence = {
  status: 'unverified',
  provenanceTier: 'external_linked',
  evidenceDetail: 'https://civitai.com/models/12345',
};
const externalDetails = getProvenanceDetails(explicitExternal);
assert.strictEqual(externalDetails.tier, 'external_linked');
assert.strictEqual(externalDetails.label, 'External Evidence Linked');
assert.strictEqual(externalDetails.isVerified, false);
console.log('✓ getProvenanceDetails resolves accurately with zero crashes');

// [TEST 3] Prevention of Unsupported Verification Claims
console.log('\n[TEST 3] Prevention of Unsupported Verification Claims');
// Attempt 1: Simulated data falsely claiming verified
const fakeVerifiedSimulated: VerificationEvidence = {
  status: 'verified',
  provenanceTier: 'verified',
  evidenceDetail: 'Simulated ComfyUI pipeline hash #89a4f2 (Demo Specimen)',
};
const check1 = validateProvenanceIntegrity(fakeVerifiedSimulated);
assert.strictEqual(check1.isValid, false);
assert.ok(check1.errorMessage?.includes('cannot claim Verified status'));

// Attempt 2: Unverified status claiming verified tier
const fakeVerifiedStatusMismatch: VerificationEvidence = {
  status: 'unverified',
  provenanceTier: 'verified',
  evidenceDetail: 'Audited client contract #8892',
};
const check2 = validateProvenanceIntegrity(fakeVerifiedStatusMismatch);
assert.strictEqual(check2.isValid, false);

// Attempt 3: Honest demo evidence classification
const honestDemo: VerificationEvidence = {
  status: 'unverified',
  provenanceTier: 'demo_evidence',
  evidenceDetail: 'Simulated pipeline recipe (Demo Specimen)',
};
const check3 = validateProvenanceIntegrity(honestDemo);
assert.strictEqual(check3.isValid, true);

// Attempt 4: Honest self-reported classification
const honestSelfReported: VerificationEvidence = {
  status: 'unverified',
  provenanceTier: 'self_reported',
  evidenceDetail: 'Self-declared portfolio metrics',
};
const check4 = validateProvenanceIntegrity(honestSelfReported);
assert.strictEqual(check4.isValid, true);

// Attempt 5: Genuine verified evidence with non-simulated audit detail
const genuineVerified: VerificationEvidence = {
  status: 'verified',
  provenanceTier: 'verified',
  evidenceDetail: 'Enterprise SLA audit report signed by Acme Corp legal counsel #2026-CB-991',
};
const check5 = validateProvenanceIntegrity(genuineVerified);
assert.strictEqual(check5.isValid, true);
console.log('✓ validateProvenanceIntegrity strictly blocks fake and unsupported verification claims');

// [TEST 4] MOCK_CREATORS Dataset Compliance (Zero Unsupported Claims)
console.log('\n[TEST 4] MOCK_CREATORS Dataset Compliance');
assert.strictEqual(MOCK_CREATORS.length, 8);

const verifiedCreators = MOCK_CREATORS.filter(
  (c) => c.verification.provenanceTier === 'verified' || c.verification.status === 'verified'
);
assert.strictEqual(
  verifiedCreators.length,
  0,
  `Expected 0 verified creators in mock dataset, but found: ${verifiedCreators.map((c) => c.name).join(', ')}`
);

const demoCreators = MOCK_CREATORS.filter((c) => c.verification.provenanceTier === 'demo_evidence');
const selfReportedCreators = MOCK_CREATORS.filter((c) => c.verification.provenanceTier === 'self_reported');

assert.strictEqual(demoCreators.length, 6, 'Expected 6 demo evidence specimens');
assert.strictEqual(selfReportedCreators.length, 2, 'Expected 2 self-reported creators');

// Verify every creator has an honest explanation
for (const creator of MOCK_CREATORS) {
  assert.ok(
    creator.verification.provenanceExplanation && creator.verification.provenanceExplanation.length > 10,
    `Creator ${creator.name} must have a non-empty provenanceExplanation`
  );
  assert.ok(
    creator.verification.provenanceTier === 'demo_evidence' || creator.verification.provenanceTier === 'self_reported',
    `Creator ${creator.name} must be classified as demo_evidence or self_reported`
  );
}
console.log('✓ All 8 mock creators comply with honest provenance rules (6 Demo Evidence, 2 Self-Reported, 0 Unsupported Verified)');

// [TEST 5] UI Provenance Resolution for Known Specimens
console.log('\n[TEST 5] UI Provenance Resolution for Key Creators');
const elena = MOCK_CREATORS.find((c) => c.id === 'creator-1')!;
const elenaProv = getProvenanceDetails(elena.verification);
assert.strictEqual(elenaProv.label, 'Demo Evidence');
assert.strictEqual(elenaProv.badgeVariant, 'accent');
assert.strictEqual(elenaProv.isVerified, false);

const zara = MOCK_CREATORS.find((c) => c.id === 'creator-5')!;
const zaraProv = getProvenanceDetails(zara.verification);
assert.strictEqual(zaraProv.label, 'Self-Reported');
assert.strictEqual(zaraProv.badgeVariant, 'warning');
assert.strictEqual(zaraProv.isVerified, false);

const kai = MOCK_CREATORS.find((c) => c.id === 'creator-2')!;
const kaiProv = getProvenanceDetails(kai.verification);
assert.strictEqual(kaiProv.label, 'Demo Evidence');
assert.strictEqual(kaiProv.isVerified, false);

const anya = MOCK_CREATORS.find((c) => c.id === 'creator-8')!;
const anyaProv = getProvenanceDetails(anya.verification);
assert.strictEqual(anyaProv.label, 'Self-Reported');
assert.strictEqual(anyaProv.isVerified, false);
console.log('✓ Specimen creators resolve to honest, non-misleading provenance badges');

console.log('\n=================================================================');
console.log('ALL 5 PROVENANCE CLASSIFICATION & INTEGRITY TESTS PASSED CLEANLY');
console.log('=================================================================\n');
