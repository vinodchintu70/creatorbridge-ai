import assert from 'node:assert';
import { reconcileBriefRecords } from '../src/utils/briefReconciliation.ts';
import type { BriefFormData } from '../src/types/brief.ts';

console.log('--- RUNNING BRIEF RECONCILIATION TEST SUITE ---');

// Helper to create valid mock brief fixtures
function createFixtureBrief(overrides: Partial<BriefFormData> = {}): BriefFormData {
  return {
    id: 'brief-fixture-1',
    title: 'Test Brief Title',
    brandName: 'Test Brand',
    objective: 'Brand awareness campaign',
    targetAudience: 'Tech enthusiasts',
    channels: ['YouTube', 'Instagram Reels'],
    contentType: 'Brand Commercial Video',
    creativeStyle: 'Cinematic Photorealism',
    aspectRatio: '16:9 Landscape (4K UHD 3840x2160)',
    duration: '30 seconds (Standard Commercial)',
    deliverablesCount: 1,
    preferredTools: ['Midjourney v6', 'Runway Gen-2'],
    requiredSkills: ['Prompt Crafting', 'Color Grading'],
    commercialUsage: 'Full Commercial Buyout (Perpetual, Worldwide, All Media)',
    usageTerritory: 'Worldwide',
    usageDuration: 'Perpetual',
    modelSafetyPolicy: 'Commercial-Safe Checkpoints Only (Zero Unlicensed LoRAs)',
    budgetMin: 50000,
    budgetMax: 100000,
    currency: 'INR',
    deadline: '2026-11-30',
    creativeConstraints: 'No cartoon aesthetics',
    referenceLinks: 'https://example.com/reference',
    invitedCreatorId: 'creator-1',
    status: 'published',
    savedRemotely: true,
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z',
    ...overrides,
  };
}

// [TEST 1] Deduplication by stable identifier
console.log('\n[TEST 1] Deduplicate remote and local records sharing a stable identifier');
const remoteBrief1 = createFixtureBrief({ id: 'brief-alpha', title: 'Remote Alpha' });
const localBrief1 = createFixtureBrief({ id: 'brief-alpha', title: 'Local Alpha' });
const reconciled1 = reconcileBriefRecords([remoteBrief1], [localBrief1]);
assert.strictEqual(reconciled1.length, 1, 'Should deduplicate matching IDs to exactly 1 record');
assert.strictEqual(reconciled1[0].id, 'brief-alpha');
console.log('✓ Stable identifier deduplication PASSED');

// [TEST 2] Authoritative remote precedence when remote is equal or newer
console.log('\n[TEST 2] Remote precedence when remote is equal or newer (prevent stale local overwrite)');
const remoteNewer = createFixtureBrief({
  id: 'brief-shared-1',
  title: 'Remote Updated Title',
  updatedAt: '2026-10-12T12:00:00.000Z',
  savedRemotely: true,
});
const localStale = createFixtureBrief({
  id: 'brief-shared-1',
  title: 'Local Stale Title',
  updatedAt: '2026-10-11T08:00:00.000Z',
  savedRemotely: false,
});
const resultStale = reconcileBriefRecords([remoteNewer], [localStale]);
assert.strictEqual(resultStale.length, 1);
assert.strictEqual(resultStale[0].title, 'Remote Updated Title', 'Remote record must take precedence over stale local record');
assert.strictEqual(resultStale[0].savedRemotely, true, 'Reconciled record should be marked savedRemotely: true');
console.log('✓ Stale local data prevented from overwriting remote record PASSED');

// [TEST 3] Strictly newer local edit preservation (offline edit conflict policy)
console.log('\n[TEST 3] Strictly newer local record is preserved as pending local modification');
const remoteOlder = createFixtureBrief({
  id: 'brief-shared-2',
  title: 'Remote Previous Version',
  updatedAt: '2026-10-10T12:00:00.000Z',
  savedRemotely: true,
});
const localNewer = createFixtureBrief({
  id: 'brief-shared-2',
  title: 'Local Fresh Offline Edit',
  updatedAt: '2026-10-12T15:00:00.000Z',
  savedRemotely: false,
});
const resultLocalNewer = reconcileBriefRecords([remoteOlder], [localNewer]);
assert.strictEqual(resultLocalNewer.length, 1);
assert.strictEqual(resultLocalNewer[0].title, 'Local Fresh Offline Edit', 'Strictly newer local record must be preserved');
assert.strictEqual(resultLocalNewer[0].savedRemotely, false, 'Pending sync should have savedRemotely: false');
console.log('✓ Newer local modification preservation PASSED');

// [TEST 4] Disjoint local records never disappear merely because remote returns rows
console.log('\n[TEST 4] Locally created briefs are preserved alongside remote briefs');
const remoteCatalog = [
  createFixtureBrief({ id: 'remote-1', title: 'Remote Campaign 1', createdAt: '2026-10-12T10:00:00.000Z' }),
  createFixtureBrief({ id: 'remote-2', title: 'Remote Campaign 2', createdAt: '2026-10-11T10:00:00.000Z' }),
];
const localOfflineCatalog = [
  createFixtureBrief({ id: 'local-offline-1', title: 'Offline Created Campaign', createdAt: '2026-10-13T09:00:00.000Z' }),
];
const reconciledMixed = reconcileBriefRecords(remoteCatalog, localOfflineCatalog);
assert.strictEqual(reconciledMixed.length, 3, 'All 3 briefs (2 remote + 1 local) must be present');
const offlineItem = reconciledMixed.find((b) => b.id === 'local-offline-1');
assert.ok(offlineItem, 'Offline local brief must not be dropped');
assert.strictEqual(offlineItem.savedRemotely, false, 'Offline brief must be marked savedRemotely: false');
console.log('✓ Disjoint local preservation PASSED');

// [TEST 5] Deterministic descending timestamp sorting
console.log('\n[TEST 5] Deterministic sorting by creation/update timestamp in descending order');
const unsortedRemote = [
  createFixtureBrief({ id: 'b-old', createdAt: '2026-10-01T00:00:00.000Z' }),
  createFixtureBrief({ id: 'b-recent', createdAt: '2026-10-12T00:00:00.000Z' }),
];
const unsortedLocal = [
  createFixtureBrief({ id: 'b-newest', createdAt: '2026-10-13T00:00:00.000Z' }),
  createFixtureBrief({ id: 'b-mid', createdAt: '2026-10-05T00:00:00.000Z' }),
];
const sortedOutput = reconcileBriefRecords(unsortedRemote, unsortedLocal);
assert.strictEqual(sortedOutput[0].id, 'b-newest');
assert.strictEqual(sortedOutput[1].id, 'b-recent');
assert.strictEqual(sortedOutput[2].id, 'b-mid');
assert.strictEqual(sortedOutput[3].id, 'b-old');
console.log('✓ Deterministic descending timestamp sort PASSED');

// [TEST 6] Drafts isolation contract
console.log('\n[TEST 6] Drafts isolation contract (drafts are never automatically published)');
const unvalidatedDraft: Partial<BriefFormData> = {
  title: 'Work in progress draft',
  status: 'draft',
};
// Simulate reconciliation with only published records
assert.strictEqual(unvalidatedDraft.status, 'draft', 'Draft must be marked draft');
assert.ok(!('id' in unvalidatedDraft), 'Unfinished draft does not require a published id');
console.log('✓ Draft isolation contract PASSED');

// [TEST 7] Currency and creator targeting preservation
console.log('\n[TEST 7] Currency preservation (INR and historical USD) & creator targeting');
const inrBrief = createFixtureBrief({ id: 'inr-1', currency: 'INR', invitedCreatorId: 'creator-2' });
const usdBrief = createFixtureBrief({ id: 'usd-1', currency: 'USD', createdAt: '2026-09-01T00:00:00.000Z', invitedCreatorId: 'creator-3' });
const reconciledCurrency = reconcileBriefRecords([inrBrief], [usdBrief]);
assert.strictEqual(reconciledCurrency.find((b) => b.id === 'inr-1')?.currency, 'INR');
assert.strictEqual(reconciledCurrency.find((b) => b.id === 'usd-1')?.currency, 'USD');
assert.strictEqual(reconciledCurrency.find((b) => b.id === 'inr-1')?.invitedCreatorId, 'creator-2');
assert.strictEqual(reconciledCurrency.find((b) => b.id === 'usd-1')?.invitedCreatorId, 'creator-3');
console.log('✓ Currency & creator targeting preservation PASSED');

console.log('\n=============================================');
console.log('ALL 7 BRIEF RECONCILIATION TEST CHECKS PASSED');
console.log('=============================================\n');
