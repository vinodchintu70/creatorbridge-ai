import assert from 'node:assert';
import {
  parseFiltersFromSearchParams,
  encodeFiltersToSearchParams,
  buildCreatorFilterUrl,
  areFiltersEqual,
  isInitialFilterState,
  DEFAULT_FILTER_STATE,
} from '../src/utils/creatorUrlState.ts';
import type { CreatorFilterState } from '../src/types/creator.ts';

console.log('--- RUNNING CREATOR FILTER URL SYNCHRONIZATION TEST SUITE (PHASE 5D) ---');

// [TEST 1] Encoding & Decoding Every Supported Filter Type Deterministically
console.log('\n[TEST 1] Deterministic encoding and decoding of every supported filter');

// 1a. Free-text search
const searchFilter: CreatorFilterState = {
  ...DEFAULT_FILTER_STATE,
  search: 'Elena Commercials',
};
const searchParams = encodeFiltersToSearchParams(searchFilter);
assert.strictEqual(searchParams.get('search'), 'Elena Commercials');
const parsedSearch = parseFiltersFromSearchParams(searchParams);
assert.strictEqual(parsedSearch.search, 'Elena Commercials');

// 1b. Free-text search alias 'q'
const parsedSearchAlias = parseFiltersFromSearchParams('q=Cinematic%20Animation');
assert.strictEqual(parsedSearchAlias.search, 'Cinematic Animation');

// 1c. Tools and software
const toolsFilter: CreatorFilterState = {
  ...DEFAULT_FILTER_STATE,
  tools: ['Flux.1 Dev', 'Runway Gen-3'],
};
const toolsParams = encodeFiltersToSearchParams(toolsFilter);
assert.strictEqual(toolsParams.get('tools'), 'Flux.1 Dev,Runway Gen-3');
const parsedTools = parseFiltersFromSearchParams(toolsParams);
assert.deepStrictEqual(parsedTools.tools.sort(), ['Flux.1 Dev', 'Runway Gen-3'].sort());

// 1d. Tools alias 'tool'
const parsedToolAlias = parseFiltersFromSearchParams('tool=ComfyUI');
assert.deepStrictEqual(parsedToolAlias.tools, ['ComfyUI']);

// 1e. Creative focus / specialization
const specFilter: CreatorFilterState = {
  ...DEFAULT_FILTER_STATE,
  specializations: ['AI Commercials', 'Generative Animation'],
};
const specParams = encodeFiltersToSearchParams(specFilter);
assert.strictEqual(specParams.get('specializations'), 'AI Commercials,Generative Animation');
const parsedSpecs = parseFiltersFromSearchParams(specParams);
assert.deepStrictEqual(parsedSpecs.specializations.sort(), ['AI Commercials', 'Generative Animation'].sort());

// 1f. Specialization aliases 'focus' and 'specialization'
const parsedFocusAlias = parseFiltersFromSearchParams('focus=Virtual%20Influencers');
assert.deepStrictEqual(parsedFocusAlias.specializations, ['Virtual Influencers']);
const parsedSpecSingle = parseFiltersFromSearchParams('specialization=Product%20VFX');
assert.deepStrictEqual(parsedSpecSingle.specializations, ['Product VFX']);

// 1g. Content types (formats)
const formatsFilter: CreatorFilterState = {
  ...DEFAULT_FILTER_STATE,
  contentTypes: ['Video', 'Animation'],
};
const formatsParams = encodeFiltersToSearchParams(formatsFilter);
assert.strictEqual(formatsParams.get('formats'), 'Animation,Video');
const parsedFormats = parseFiltersFromSearchParams(formatsParams);
assert.deepStrictEqual(parsedFormats.contentTypes.sort(), ['Animation', 'Video'].sort());

// 1h. Content types aliases 'format', 'contentType', 'contentTypes'
const parsedFormatAlias = parseFiltersFromSearchParams('format=Still%20Image');
assert.deepStrictEqual(parsedFormatAlias.contentTypes, ['Still Image']);
const parsedContentTypeAlias = parseFiltersFromSearchParams('contentType=3D%20Asset');
assert.deepStrictEqual(parsedContentTypeAlias.contentTypes, ['3D Asset']);

// 1i. Aspect ratios
const ratiosFilter: CreatorFilterState = {
  ...DEFAULT_FILTER_STATE,
  aspectRatios: ['16:9 Landscape', '9:16 Vertical'],
};
const ratiosParams = encodeFiltersToSearchParams(ratiosFilter);
assert.strictEqual(ratiosParams.get('ratios'), '16:9 Landscape,9:16 Vertical');
const parsedRatios = parseFiltersFromSearchParams(ratiosParams);
assert.deepStrictEqual(parsedRatios.aspectRatios.sort(), ['16:9 Landscape', '9:16 Vertical'].sort());

// 1j. Aspect ratios aliases 'ratio', 'aspectRatio', 'aspectRatios'
const parsedRatioAlias = parseFiltersFromSearchParams('ratio=1:1%20Square');
assert.deepStrictEqual(parsedRatioAlias.aspectRatios, ['1:1 Square']);

// 1k. Commercial license
const licenseFilter: CreatorFilterState = {
  ...DEFAULT_FILTER_STATE,
  commercialLicense: 'Full IP Buyout',
};
const licenseParams = encodeFiltersToSearchParams(licenseFilter);
assert.strictEqual(licenseParams.get('commercial'), 'Full IP Buyout');
const parsedLicense = parseFiltersFromSearchParams(licenseParams);
assert.strictEqual(parsedLicense.commercialLicense, 'Full IP Buyout');

// 1l. Commercial license aliases 'usage', 'license', 'commercialLicense'
const parsedUsageAlias = parseFiltersFromSearchParams('usage=Exclusive%20Commercial');
assert.strictEqual(parsedUsageAlias.commercialLicense, 'Exclusive Commercial');
const parsedLicenseAlias = parseFiltersFromSearchParams('license=Standard%20Agency');
assert.strictEqual(parsedLicenseAlias.commercialLicense, 'Standard Agency');

// 1m. Verified filter (boolean true/1/yes)
const verifiedFilter: CreatorFilterState = {
  ...DEFAULT_FILTER_STATE,
  verifiedOnly: true,
};
const verifiedParams = encodeFiltersToSearchParams(verifiedFilter);
assert.strictEqual(verifiedParams.get('verified'), 'true');
assert.strictEqual(parseFiltersFromSearchParams(verifiedParams).verifiedOnly, true);
assert.strictEqual(parseFiltersFromSearchParams('verified=1').verifiedOnly, true);
assert.strictEqual(parseFiltersFromSearchParams('verified=yes').verifiedOnly, true);
assert.strictEqual(parseFiltersFromSearchParams('verifiedOnly=true').verifiedOnly, true);
assert.strictEqual(parseFiltersFromSearchParams('verified=false').verifiedOnly, false);
console.log('✓ Individual filter encoding and decoding PASSED');

// [TEST 2] Restoring Combined Multi-Filter URL State
console.log('\n[TEST 2] Restoring combined multi-filter state from URL');
const combinedQuery =
  'search=Cinematic&tools=Runway%20Gen-3,ComfyUI&specializations=AI%20Commercials&formats=Video&ratios=16:9%20Landscape&commercial=Full%20IP%20Buyout&verified=true';
const combinedState = parseFiltersFromSearchParams(combinedQuery);

assert.strictEqual(combinedState.search, 'Cinematic');
assert.deepStrictEqual(combinedState.tools.sort(), ['ComfyUI', 'Runway Gen-3'].sort());
assert.deepStrictEqual(combinedState.specializations, ['AI Commercials']);
assert.deepStrictEqual(combinedState.contentTypes, ['Video']);
assert.deepStrictEqual(combinedState.aspectRatios, ['16:9 Landscape']);
assert.strictEqual(combinedState.commercialLicense, 'Full IP Buyout');
assert.strictEqual(combinedState.verifiedOnly, true);

// Re-encode and verify deterministic path building
const builtUrl = buildCreatorFilterUrl(combinedState);
assert.ok(builtUrl.startsWith('/creators?'), 'Built URL must target /creators path');
assert.ok(builtUrl.includes('search=Cinematic'), 'Contains search');
assert.ok(builtUrl.includes('tools=ComfyUI%2CRunway+Gen-3') || builtUrl.includes('tools=ComfyUI,Runway%20Gen-3'), 'Contains tools');
assert.ok(builtUrl.includes('commercial=Full+IP+Buyout') || builtUrl.includes('commercial=Full%20IP%20Buyout'), 'Contains commercial');
console.log('✓ Combined multi-filter state restoration PASSED');

// [TEST 3] Safe Handling of Invalid, Unknown, Duplicated, or Malformed Values
console.log('\n[TEST 3] Sanitization of invalid, unknown, and duplicated query values');
const dirtyQuery =
  'tools=Flux.1%20Dev,BogusTool,flux.1%20dev,HackerApp&specializations=NonExistent&formats=Video,MP4Format&ratios=4:3,16:9%20Landscape&commercial=FakeLicense&verified=notabool';
const sanitized = parseFiltersFromSearchParams(dirtyQuery);

// Tools: BogusTool and HackerApp removed; duplicate flux.1 dev deduplicated to single canonical 'Flux.1 Dev'
assert.deepStrictEqual(sanitized.tools, ['Flux.1 Dev'], 'Invalid tools stripped, deduplicated');
// Specializations: NonExistent stripped -> empty array
assert.deepStrictEqual(sanitized.specializations, [], 'Invalid specialization stripped');
// Formats: MP4Format stripped -> only Video remains
assert.deepStrictEqual(sanitized.contentTypes, ['Video'], 'Invalid content type stripped');
// Ratios: 4:3 stripped -> only 16:9 Landscape remains
assert.deepStrictEqual(sanitized.aspectRatios, ['16:9 Landscape'], 'Invalid ratio stripped');
// Commercial: FakeLicense falls back safely to 'all'
assert.strictEqual(sanitized.commercialLicense, 'all', 'Invalid commercial falls back to all');
// Verified: 'notabool' safely resolves to false
assert.strictEqual(sanitized.verifiedOnly, false, 'Invalid verified flag defaults to false');
console.log('✓ Sanitization of invalid and duplicate values PASSED');

// [TEST 4] Updating One Filter Without Deleting Other Filters or Unrelated Params
console.log('\n[TEST 4] Incremental filter updates and unrelated parameter preservation');
const initialUrlWithParams =
  '?utm_source=google&ref=partner_hub&search=VFX&tools=ComfyUI&creator=creator-1';

// Update tools to add Flux.1 Dev while preserving everything else
const updatedFilters: CreatorFilterState = {
  ...parseFiltersFromSearchParams(initialUrlWithParams),
  tools: ['ComfyUI', 'Flux.1 Dev'],
};
const encodedUpdated = encodeFiltersToSearchParams(updatedFilters, {
  existingParams: initialUrlWithParams,
});

// Preserves unrelated tracking params
assert.strictEqual(encodedUpdated.get('utm_source'), 'google', 'Unrelated utm_source preserved');
assert.strictEqual(encodedUpdated.get('ref'), 'partner_hub', 'Unrelated ref preserved');
// Preserves existing creator parameter
assert.strictEqual(encodedUpdated.get('creator'), 'creator-1', 'Creator deep link preserved');
// Preserves existing search query
assert.strictEqual(encodedUpdated.get('search'), 'VFX', 'Existing search preserved');
// Contains newly updated tools
assert.strictEqual(encodedUpdated.get('tools'), 'ComfyUI,Flux.1 Dev', 'Tools correctly updated');

// Removing tools only removes the 'tools' key
const withoutTools: CreatorFilterState = {
  ...updatedFilters,
  tools: [],
};
const encodedWithoutTools = encodeFiltersToSearchParams(withoutTools, {
  existingParams: encodedUpdated,
});
assert.strictEqual(encodedWithoutTools.has('tools'), false, 'Tools parameter cleanly removed');
assert.strictEqual(encodedWithoutTools.get('search'), 'VFX', 'Search still intact');
assert.strictEqual(encodedWithoutTools.get('creator'), 'creator-1', 'Creator still intact');
assert.strictEqual(encodedWithoutTools.get('utm_source'), 'google', 'UTM still intact');
console.log('✓ Incremental filter updates and parameter preservation PASSED');

// [TEST 5] Resetting Filters While Preserving Selected Creator Deep Link
console.log('\n[TEST 5] Resetting filters preserves selected creator modal deep link');
const activeWithCreator =
  'search=Runway&tools=Runway%20Gen-3&verified=true&creator=creator-2&campaign=winter';

// Resetting filters with creatorId options preserved
const resetParams = encodeFiltersToSearchParams(DEFAULT_FILTER_STATE, {
  existingParams: activeWithCreator,
  creatorId: 'creator-2',
});

// All filter params are gone
assert.strictEqual(resetParams.has('search'), false, 'Search removed on reset');
assert.strictEqual(resetParams.has('tools'), false, 'Tools removed on reset');
assert.strictEqual(resetParams.has('verified'), false, 'Verified removed on reset');
// Creator and unrelated campaign remain
assert.strictEqual(resetParams.get('creator'), 'creator-2', 'Creator parameter retained');
assert.strictEqual(resetParams.get('campaign'), 'winter', 'Unrelated query preserved');
assert.strictEqual(isInitialFilterState(DEFAULT_FILTER_STATE), true, 'Is initial filter state');

const resetUrl = buildCreatorFilterUrl(DEFAULT_FILTER_STATE, {
  existingParams: activeWithCreator,
  creatorId: 'creator-2',
});
assert.ok(resetUrl.includes('creator=creator-2'), 'Reset URL maintains creator');
assert.ok(!resetUrl.includes('search='), 'Reset URL omits search');
assert.ok(!resetUrl.includes('tools='), 'Reset URL omits tools');
console.log('✓ Reset filters with creator preservation PASSED');

// [TEST 6] Filter Equality and History Traversal (Back/Forward) State Sync
console.log('\n[TEST 6] areFiltersEqual semantic comparison and history navigation');

const stateA: CreatorFilterState = {
  search: 'Elena',
  tools: ['Flux.1 Dev', 'ComfyUI'],
  specializations: ['AI Commercials'],
  contentTypes: ['Video'],
  aspectRatios: ['16:9 Landscape'],
  commercialLicense: 'Full IP Buyout',
  verifiedOnly: true,
};

// State B has tools in different order - must still be equal!
const stateB: CreatorFilterState = {
  search: 'Elena',
  tools: ['ComfyUI', 'Flux.1 Dev'],
  specializations: ['AI Commercials'],
  contentTypes: ['Video'],
  aspectRatios: ['16:9 Landscape'],
  commercialLicense: 'Full IP Buyout',
  verifiedOnly: true,
};
assert.strictEqual(areFiltersEqual(stateA, stateB), true, 'Order-independent filter equality');

// State C has different search - must not be equal
const stateC: CreatorFilterState = { ...stateA, search: 'Kai' };
assert.strictEqual(areFiltersEqual(stateA, stateC), false, 'Different search detected');

// State D has verifiedOnly false - must not be equal
const stateD: CreatorFilterState = { ...stateA, verifiedOnly: false };
assert.strictEqual(areFiltersEqual(stateA, stateD), false, 'Different verifiedOnly detected');

// Simulated Browser History (Back / Forward) sequence
class MockHistoryStack {
  private stack: string[] = [];
  private pointer = -1;

  push(url: string) {
    this.stack = this.stack.slice(0, this.pointer + 1);
    this.stack.push(url);
    this.pointer = this.stack.length - 1;
  }

  replace(url: string) {
    if (this.pointer >= 0) {
      this.stack[this.pointer] = url;
    } else {
      this.push(url);
    }
  }

  back(): string | null {
    if (this.pointer > 0) {
      this.pointer--;
      return this.stack[this.pointer];
    }
    return null;
  }

  forward(): string | null {
    if (this.pointer < this.stack.length - 1) {
      this.pointer++;
      return this.stack[this.pointer];
    }
    return null;
  }

  current(): string {
    return this.stack[this.pointer] || '/creators';
  }
}

const history = new MockHistoryStack();

// Step 1: User visits /creators
history.push('/creators');
assert.strictEqual(isInitialFilterState(parseFiltersFromSearchParams(history.current())), true);

// Step 2: User filters by tool 'Runway Gen-3'
const step2Url = buildCreatorFilterUrl({ ...DEFAULT_FILTER_STATE, tools: ['Runway Gen-3'] });
history.push(step2Url);
assert.deepStrictEqual(parseFiltersFromSearchParams(history.current()).tools, ['Runway Gen-3']);

// Step 3: User opens Elena Rostova's profile (creator-1) while filter is active
const step3Url = buildCreatorFilterUrl(
  { ...DEFAULT_FILTER_STATE, tools: ['Runway Gen-3'] },
  { existingParams: history.current(), creatorId: 'creator-1' }
);
history.push(step3Url);
const step3Params = new URLSearchParams(step3Url.split('?')[1]);
assert.strictEqual(step3Params.get('creator'), 'creator-1');
assert.deepStrictEqual(parseFiltersFromSearchParams(step3Params).tools, ['Runway Gen-3']);

// Step 4: User presses browser Back -> Should close creator modal but keep 'Runway Gen-3' filter!
const step4Url = history.back();
assert.ok(step4Url);
const step4Params = new URLSearchParams(step4Url.split('?')[1]);
assert.strictEqual(step4Params.get('creator'), null, 'Creator modal closed');
assert.deepStrictEqual(parseFiltersFromSearchParams(step4Params).tools, ['Runway Gen-3'], 'Filter retained');

// Step 5: User presses browser Back again -> Should restore initial filter state
const step5Url = history.back();
assert.ok(step5Url);
assert.strictEqual(isInitialFilterState(parseFiltersFromSearchParams(step5Url)), true);

// Step 6: User presses browser Forward -> Should restore 'Runway Gen-3' filter
const step6Url = history.forward();
assert.ok(step6Url);
assert.deepStrictEqual(parseFiltersFromSearchParams(step6Url).tools, ['Runway Gen-3']);

// Step 7: User presses browser Forward -> Should restore Elena's profile with 'Runway Gen-3'
const step7Url = history.forward();
assert.ok(step7Url);
const step7Params = new URLSearchParams(step7Url.split('?')[1]);
assert.strictEqual(step7Params.get('creator'), 'creator-1');
assert.deepStrictEqual(parseFiltersFromSearchParams(step7Params).tools, ['Runway Gen-3']);

console.log('✓ History stack traversal and creator deep-link synchronization PASSED');

console.log('\n--- ALL CREATOR FILTER URL SYNCHRONIZATION TESTS PASSED SUCCESSFULLY ---');
