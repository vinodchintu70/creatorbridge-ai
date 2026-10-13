import assert from 'node:assert';
import { MOCK_CREATORS } from '../src/data/mockCreators.ts';
import {
  filterCreators,
  countActiveFilters,
  INITIAL_FILTER_STATE,
} from '../src/utils/filterCreators.ts';

console.log('--- RUNNING CREATOR DISCOVERY & FILTERING TEST SUITE ---');

// [TEST 1] Baseline Initial State returns all 8 creators
console.log('\n[TEST 1] Initial filter state returns complete creator directory');
const allCreators = filterCreators(MOCK_CREATORS, INITIAL_FILTER_STATE);
assert.strictEqual(allCreators.length, 8, 'Expected all 8 mock creators with initial filters');
assert.strictEqual(countActiveFilters(INITIAL_FILTER_STATE), 0, 'Active filter count should be 0 initially');
console.log('✓ Initial filter state check PASSED');

// [TEST 2] Text search by Name, Handle, Bio, and Skill
console.log('\n[TEST 2] Free-text search by name, handle, bio, and skills');
// 2a. Name search
const nameResults = filterCreators(MOCK_CREATORS, { ...INITIAL_FILTER_STATE, search: 'Elena' });
assert.strictEqual(nameResults.length, 1);
assert.strictEqual(nameResults[0].id, 'creator-1');

// 2b. Handle search
const handleResults = filterCreators(MOCK_CREATORS, { ...INITIAL_FILTER_STATE, search: '@kai_worldbuilder' });
assert.strictEqual(handleResults.length, 1);
assert.strictEqual(handleResults[0].id, 'creator-2');

// 2c. Skill search ('Character Consistency')
const skillResults = filterCreators(MOCK_CREATORS, { ...INITIAL_FILTER_STATE, search: 'Character Consistency' });
assert.ok(skillResults.length >= 1, 'Should find creators with Character Consistency skill');
assert.ok(skillResults.some((c) => c.id === 'creator-1'), 'Elena Rostova has Character Consistency');

// 2d. Project search ('Obsidian')
const projectResults = filterCreators(MOCK_CREATORS, { ...INITIAL_FILTER_STATE, search: 'Obsidian' });
assert.strictEqual(projectResults.length, 1);
assert.strictEqual(projectResults[0].id, 'creator-1');
console.log('✓ Text search checks PASSED');

// [TEST 3] AI Tools & Software Filter
console.log('\n[TEST 3] Filter creators by Tools & Software');
const runwayCreators = filterCreators(MOCK_CREATORS, { ...INITIAL_FILTER_STATE, tools: ['Runway Gen-3'] });
assert.ok(runwayCreators.length >= 2, 'Multiple creators use Runway Gen-3');
for (const c of runwayCreators) {
  const tools = new Set([...c.primaryTools, ...c.portfolio.flatMap((p) => p.toolsUsed)]);
  assert.ok(tools.has('Runway Gen-3'), `Creator ${c.name} must use Runway Gen-3`);
}

const comfyCreators = filterCreators(MOCK_CREATORS, { ...INITIAL_FILTER_STATE, tools: ['ComfyUI'] });
assert.ok(comfyCreators.length >= 3, 'Multiple creators use ComfyUI');
console.log('✓ Tools & Software filtering PASSED');

// [TEST 4] Specialization / Creative Focus Filter
console.log('\n[TEST 4] Filter creators by Creative Focus / Specialization');
const commercialCreators = filterCreators(MOCK_CREATORS, {
  ...INITIAL_FILTER_STATE,
  specializations: ['AI Commercials'],
});
assert.ok(commercialCreators.length >= 1, 'At least 1 creator in AI Commercials');
for (const c of commercialCreators) {
  assert.strictEqual(c.specialization, 'AI Commercials');
}

const worldbuilderCreators = filterCreators(MOCK_CREATORS, {
  ...INITIAL_FILTER_STATE,
  specializations: ['Cinematic Worldbuilding'],
});
assert.ok(worldbuilderCreators.length >= 1);
assert.ok(worldbuilderCreators.some((c) => c.name === 'Kai Takahashi'));
console.log('✓ Creative Focus filtering PASSED');

// [TEST 5] Format Filters: Content Type & Aspect Ratio
console.log('\n[TEST 5] Filter creators by Format (Content Type & Aspect Ratio)');
const videoCreators = filterCreators(MOCK_CREATORS, {
  ...INITIAL_FILTER_STATE,
  contentTypes: ['Video'],
});
assert.ok(videoCreators.length >= 2, 'Multiple creators produce Video');
for (const c of videoCreators) {
  assert.ok(c.portfolio.some((p) => p.contentType === 'Video'));
}

const verticalCreators = filterCreators(MOCK_CREATORS, {
  ...INITIAL_FILTER_STATE,
  aspectRatios: ['9:16 Vertical'],
});
assert.ok(verticalCreators.length >= 2, 'Multiple creators produce 9:16 Vertical');
for (const c of verticalCreators) {
  assert.ok(c.portfolio.some((p) => p.aspectRatio === '9:16 Vertical'));
}
console.log('✓ Format & Aspect Ratio filtering PASSED');

// [TEST 6] Commercial Usage Rights Filter
console.log('\n[TEST 6] Filter creators by Commercial Usage Rights');
const buyoutCreators = filterCreators(MOCK_CREATORS, {
  ...INITIAL_FILTER_STATE,
  commercialLicense: 'Full IP Buyout',
});
assert.ok(buyoutCreators.length >= 3, 'Multiple creators support Full IP Buyout');
for (const c of buyoutCreators) {
  assert.ok(
    c.commercialSuitability === 'Full IP Buyout' ||
      c.portfolio.some((p) => p.commercialLicense === 'Full IP Buyout'),
    `Creator ${c.name} must match Full IP Buyout`
  );
}
console.log('✓ Commercial Usage Rights filtering PASSED');

// [TEST 7] Combined Multi-Filter Query
console.log('\n[TEST 7] Multi-filter combination queries');
const combinedQuery = filterCreators(MOCK_CREATORS, {
  ...INITIAL_FILTER_STATE,
  tools: ['Flux.1 Dev'],
  specializations: ['Cinematic Worldbuilding'],
  contentTypes: ['Still Image'],
});
assert.strictEqual(combinedQuery.length, 1, 'Kai Takahashi matches this precise combination');
assert.strictEqual(combinedQuery[0].name, 'Kai Takahashi');

const combinedActiveCount = countActiveFilters({
  ...INITIAL_FILTER_STATE,
  search: 'Sci-Fi',
  tools: ['Flux.1 Dev'],
  specializations: ['Cinematic Worldbuilding'],
  contentTypes: ['Still Image'],
});
assert.strictEqual(combinedActiveCount, 4, 'Active filter count should equal 4');
console.log('✓ Multi-filter combination PASSED');

// [TEST 8] Empty State Trigger & Reset Behavior
console.log('\n[TEST 8] Empty state query and filter reset');
const emptyQuery = filterCreators(MOCK_CREATORS, {
  ...INITIAL_FILTER_STATE,
  search: 'NonExistentCreatorQueryXYZ123456789',
});
assert.strictEqual(emptyQuery.length, 0, 'Zero results trigger empty state');

// Resetting returns all 8 creators
const resetResults = filterCreators(MOCK_CREATORS, INITIAL_FILTER_STATE);
assert.strictEqual(resetResults.length, 8, 'Reset returns full creator catalog');
console.log('✓ Empty state & reset behavior PASSED');

// [TEST 9] Honest Verification Filter Compliance
console.log('\n[TEST 9] Verified Only filter compliance with honest mock data');
const verifiedOnlyQuery = filterCreators(MOCK_CREATORS, {
  ...INITIAL_FILTER_STATE,
  verifiedOnly: true,
});
assert.strictEqual(
  verifiedOnlyQuery.length,
  0,
  'Verified filter yields 0 creators because mock creators honestly represent Demo Evidence and Self-Reported tiers without claiming fake independent verification'
);
console.log('✓ Verified Only filter honesty check PASSED');

console.log('\n=============================================================');
console.log('ALL 9 CREATOR DISCOVERY & FILTERING TEST SUITE CHECKS PASSED');
console.log('=============================================================');
