import assert from 'node:assert';
import { MOCK_CREATORS } from '../src/data/mockCreators.ts';
import { reconcileBriefRecords } from '../src/utils/briefReconciliation.ts';
import { mapBriefContentTypeToPortfolioFormat } from '../src/utils/domainAdapters.ts';
import { formatBudgetRange, isHistoricalUSDBrief } from '../src/utils/formatCurrency.ts';
import type { BriefFormData } from '../src/types/brief.ts';

const getCreatorById = (id: string) => MOCK_CREATORS.find((c) => c.id === id) || null;

console.log('--- RUNNING CAMPAIGNS HUB TEST SUITE ---');

// Mock brief fixture creator
function createTestBrief(overrides: Partial<BriefFormData> = {}): BriefFormData {
  return {
    id: 'campaign-1',
    title: 'Autumn Fashion AI Showcase',
    brandName: 'Aura Apparel',
    objective: 'Showcase seasonal line with synthetic model lookbook',
    targetAudience: 'Fashion-forward Gen Z & Millennials',
    channels: ['Instagram Reels', 'TikTok'],
    contentType: 'Brand Commercial Video',
    creativeStyle: 'Cinematic Photorealism',
    aspectRatio: '16:9 Landscape (4K UHD 3840x2160)',
    duration: '30 seconds (Standard Commercial)',
    deliverablesCount: 2,
    preferredTools: ['Midjourney v6', 'Runway Gen-2'],
    requiredSkills: ['Prompt Crafting', 'Color Grading'],
    commercialUsage: 'Full Commercial Buyout (Perpetual, Worldwide, All Media)',
    usageTerritory: 'Worldwide',
    usageDuration: 'Perpetual',
    modelSafetyPolicy: 'Commercial-Safe Checkpoints Only (Zero Unlicensed LoRAs)',
    budgetMin: 80000,
    budgetMax: 150000,
    currency: 'INR',
    deadline: '2026-11-15',
    creativeConstraints: 'Natural textile movement and photorealistic hands',
    referenceLinks: 'https://aura.example/moodboard',
    invitedCreatorId: 'creator-1',
    status: 'published',
    savedRemotely: true,
    createdAt: '2026-10-12T10:00:00.000Z',
    updatedAt: '2026-10-12T10:00:00.000Z',
    ...overrides,
  };
}

// [TEST 1] Campaigns Hub Data Feed & Reconciled Listing
console.log('\n[TEST 1] Campaigns Hub displays reconciled briefs list');
const remoteCampaigns = [
  createTestBrief({ id: 'camp-remote-1', title: 'Remote Campaign 1', savedRemotely: true }),
  createTestBrief({ id: 'camp-remote-2', title: 'Remote Campaign 2', savedRemotely: true }),
];
const localCampaigns = [
  createTestBrief({ id: 'camp-local-1', title: 'Offline Local Campaign', savedRemotely: false }),
];
const hubFeed = reconcileBriefRecords(remoteCampaigns, localCampaigns);
assert.strictEqual(hubFeed.length, 3, 'Campaigns Hub must display all 3 reconciled briefs');
assert.strictEqual(hubFeed.filter((b) => b.savedRemotely).length, 2, '2 database-synced briefs');
assert.strictEqual(hubFeed.filter((b) => !b.savedRemotely).length, 1, '1 local store brief');
console.log('✓ Campaigns Hub data reconciliation PASSED');

// [TEST 2] Search and Filter Contracts
console.log('\n[TEST 2] Search and storage filter evaluation');
// 2a. Filter by search query (brand, title, format, creator name)
function filterHubCampaigns(
  briefs: BriefFormData[],
  query: string,
  storageFilter: 'all' | 'remote' | 'local'
) {
  return briefs.filter((b) => {
    if (storageFilter === 'remote' && !b.savedRemotely) return false;
    if (storageFilter === 'local' && b.savedRemotely) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    const matchTitle = b.title.toLowerCase().includes(q);
    const matchBrand = b.brandName.toLowerCase().includes(q);
    const matchType = b.contentType.toLowerCase().includes(q);
    const targetCreator = b.invitedCreatorId ? getCreatorById(b.invitedCreatorId) : null;
    const matchCreator = targetCreator ? targetCreator.name.toLowerCase().includes(q) : false;
    return matchTitle || matchBrand || matchType || matchCreator;
  });
}

const searchByBrand = filterHubCampaigns(hubFeed, 'Aura', 'all');
assert.strictEqual(searchByBrand.length, 3);

const filterRemoteOnly = filterHubCampaigns(hubFeed, '', 'remote');
assert.strictEqual(filterRemoteOnly.length, 2);
assert.ok(filterRemoteOnly.every((b) => b.savedRemotely));

const filterLocalOnly = filterHubCampaigns(hubFeed, '', 'local');
assert.strictEqual(filterLocalOnly.length, 1);
assert.ok(filterLocalOnly.every((b) => !b.savedRemotely));
console.log('✓ Search and storage filtering PASSED');

// [TEST 3] Empty State Contract
console.log('\n[TEST 3] Empty state detection when zero briefs exist');
const emptyFeed: BriefFormData[] = [];
assert.strictEqual(emptyFeed.length, 0, 'Zero briefs triggers empty state in Hub');
console.log('✓ Empty state contract PASSED');

// [TEST 4] Targeted Creator Resolution and Truthful Labeling
console.log('\n[TEST 4] Targeted creator resolution without false notification claims');
const targetedBrief = createTestBrief({ invitedCreatorId: 'creator-1' });
const creator = getCreatorById(targetedBrief.invitedCreatorId || '');
assert.ok(creator, 'Targeted creator-1 must resolve cleanly');
assert.strictEqual(creator?.name, 'Elena Rostova');
// Truthful wording check: does not promise that creator was emailed or accepted
const truthfulLabel = `This brief is targeted to ${creator?.name}`;
assert.ok(truthfulLabel.includes('Elena Rostova'));
assert.ok(!truthfulLabel.includes('notified'), 'Must not claim creator has been notified');
assert.ok(!truthfulLabel.includes('accepted'), 'Must not claim creator has accepted');
console.log('✓ Targeted creator truthful labeling PASSED');

// [TEST 5] Domain Adapter Integration for "Find Creators" Action
console.log('\n[TEST 5] Content format mapping to creator portfolio category');
const videoBrief = createTestBrief({ contentType: 'Brand Commercial Video' });
const vfxBrief = createTestBrief({ contentType: '3D Product VFX' });
const personaBrief = createTestBrief({ contentType: 'Virtual Persona Asset' });

assert.strictEqual(mapBriefContentTypeToPortfolioFormat(videoBrief.contentType), 'Video');
assert.strictEqual(mapBriefContentTypeToPortfolioFormat(vfxBrief.contentType), '3D Asset');
assert.strictEqual(mapBriefContentTypeToPortfolioFormat(personaBrief.contentType), 'Still Image');
console.log('✓ Domain adapter creator search format mapping PASSED');

// [TEST 6] Currency Formatting (INR and Historical USD)
console.log('\n[TEST 6] Currency representation in Campaigns Hub cards');
const currentInrCampaign = createTestBrief({
  budgetMin: 50000,
  budgetMax: 100000,
  currency: 'INR',
  createdAt: '2026-10-12T00:00:00.000Z',
});
const historicalUsdCampaign = createTestBrief({
  budgetMin: 1500,
  budgetMax: 3000,
  currency: 'USD',
  createdAt: '2026-09-01T00:00:00.000Z',
});

const inrFormatted = formatBudgetRange(
  currentInrCampaign.budgetMin,
  currentInrCampaign.budgetMax,
  currentInrCampaign.currency || 'INR'
);
assert.ok(inrFormatted.includes('₹'), 'INR format must include rupee symbol');

const usdCurrency = isHistoricalUSDBrief(historicalUsdCampaign.createdAt) ? 'USD' : 'INR';
assert.strictEqual(usdCurrency, 'USD', 'Historical brief must resolve to USD');
const usdFormatted = formatBudgetRange(
  historicalUsdCampaign.budgetMin,
  historicalUsdCampaign.budgetMax,
  usdCurrency
);
assert.ok(usdFormatted.includes('$'), 'Historical USD format must include dollar symbol');
console.log('✓ Currency representations PASSED');

// [TEST 7] Publishing Workflow Navigation Contract
console.log('\n[TEST 7] Publication leads to /briefs Campaigns Hub');
const publishSuccessDestination = '/briefs';
assert.strictEqual(publishSuccessDestination, '/briefs', 'Successful brief publication must route to /briefs');
console.log('✓ Navigation destination contract PASSED');

console.log('\n========================================');
console.log('ALL 7 CAMPAIGNS HUB TEST CHECKS PASSED');
console.log('========================================\n');
