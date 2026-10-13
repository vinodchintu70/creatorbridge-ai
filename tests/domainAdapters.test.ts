import assert from 'node:assert';
import {
  BRIEF_TO_PORTFOLIO_CONTENT_TYPE,
  PORTFOLIO_TO_BRIEF_CONTENT_TYPES,
  BRIEF_USAGE_TO_COMMERCIAL_SUITABILITY,
  COMMERCIAL_SUITABILITY_TO_BRIEF_USAGE,
  COMMERCIAL_USAGE_LEGAL_NOTICE,
  mapBriefContentTypeToPortfolioFormat,
  mapPortfolioFormatToBriefFormats,
  isPortfolioFormatCompatible,
  mapBriefUsageToCommercialSuitability,
  mapCommercialSuitabilityToBriefUsage,
  isCreatorSuitabilityCompatible,
  getCommercialLicensingGuidance,
} from '../src/utils/domainAdapters.ts';
import type { ContentType } from '../src/types/creator.ts';

console.log('--- RUNNING DOMAIN ADAPTERS TEST SUITE ---');

// [TEST 1] Canonical Brief to Portfolio Format Mappings (All 6 Types)
console.log('\n[TEST 1] Map BriefContentType to Portfolio ContentType');
assert.strictEqual(Object.keys(BRIEF_TO_PORTFOLIO_CONTENT_TYPE).length, 6);
assert.strictEqual(mapBriefContentTypeToPortfolioFormat('Brand Commercial Video'), 'Video');
assert.strictEqual(mapBriefContentTypeToPortfolioFormat('Social Video Reel / UGC'), 'Video');
assert.strictEqual(mapBriefContentTypeToPortfolioFormat('3D Product VFX'), '3D Asset');
assert.strictEqual(mapBriefContentTypeToPortfolioFormat('Key Visual Still'), 'Still Image');
assert.strictEqual(mapBriefContentTypeToPortfolioFormat('Virtual Persona Asset'), 'Still Image');
assert.strictEqual(mapBriefContentTypeToPortfolioFormat('Generative Animation'), 'Animation');
console.log('✓ All 6 BriefContentType mappings verified');

// [TEST 2] Reverse Portfolio Format to Brief Formats Mappings
console.log('\n[TEST 2] Map Portfolio ContentType to BriefContentType arrays');
assert.strictEqual(Object.keys(PORTFOLIO_TO_BRIEF_CONTENT_TYPES).length, 4);
assert.deepStrictEqual(mapPortfolioFormatToBriefFormats('Video'), [
  'Brand Commercial Video',
  'Social Video Reel / UGC',
]);
assert.deepStrictEqual(mapPortfolioFormatToBriefFormats('Animation'), ['Generative Animation']);
assert.deepStrictEqual(mapPortfolioFormatToBriefFormats('Still Image'), [
  'Key Visual Still',
  'Virtual Persona Asset',
]);
assert.deepStrictEqual(mapPortfolioFormatToBriefFormats('3D Asset'), ['3D Product VFX']);
console.log('✓ Reverse format mappings verified');

// [TEST 3] Boundary and Unmapped Content Formats
console.log('\n[TEST 3] Unmapped and boundary content format handling');
assert.strictEqual(mapBriefContentTypeToPortfolioFormat(''), null);
assert.strictEqual(mapBriefContentTypeToPortfolioFormat(undefined), null);
assert.strictEqual(mapBriefContentTypeToPortfolioFormat(null), null);
assert.strictEqual(mapBriefContentTypeToPortfolioFormat('Interactive VR Game'), null);
assert.deepStrictEqual(mapPortfolioFormatToBriefFormats('Hologram'), []);
assert.deepStrictEqual(mapPortfolioFormatToBriefFormats(undefined), []);
assert.deepStrictEqual(mapPortfolioFormatToBriefFormats(null), []);
console.log('✓ Content format boundary cases safely return null/empty');

// [TEST 4] Creator Portfolio Format Compatibility Check
console.log('\n[TEST 4] isPortfolioFormatCompatible checks');
const videoCreatorFormats: ContentType[] = ['Video'];
const multiFormatCreator: ContentType[] = ['Still Image', '3D Asset'];

assert.strictEqual(
  isPortfolioFormatCompatible(videoCreatorFormats, 'Brand Commercial Video'),
  true,
  'Video creator is compatible with commercial video brief'
);
assert.strictEqual(
  isPortfolioFormatCompatible(videoCreatorFormats, '3D Product VFX'),
  false,
  'Video creator is not compatible with 3D product VFX'
);
assert.strictEqual(
  isPortfolioFormatCompatible(multiFormatCreator, '3D Product VFX'),
  true,
  '3D asset creator is compatible with 3D product VFX brief'
);
assert.strictEqual(
  isPortfolioFormatCompatible(multiFormatCreator, 'Key Visual Still'),
  true,
  'Still image creator is compatible with Key Visual Still'
);
assert.strictEqual(isPortfolioFormatCompatible([], 'Brand Commercial Video'), false);
assert.strictEqual(isPortfolioFormatCompatible(null, 'Brand Commercial Video'), false);
assert.strictEqual(isPortfolioFormatCompatible(videoCreatorFormats, 'Unknown Type'), false);
console.log('✓ Portfolio format compatibility verified');

// [TEST 5] Canonical Usage Rights to Commercial Suitability Mappings
console.log('\n[TEST 5] Map BriefCommercialUsage to CommercialSuitability');
assert.strictEqual(Object.keys(BRIEF_USAGE_TO_COMMERCIAL_SUITABILITY).length, 4);
assert.strictEqual(
  mapBriefUsageToCommercialSuitability('Full Global IP Buyout'),
  'Full IP Buyout'
);
assert.strictEqual(
  mapBriefUsageToCommercialSuitability('1-Year Digital Exclusive'),
  'Exclusive Commercial'
);
assert.strictEqual(
  mapBriefUsageToCommercialSuitability('Standard Agency License'),
  'Standard Agency'
);
assert.strictEqual(
  mapBriefUsageToCommercialSuitability('Restricted Social Use'),
  'Standard Agency'
);
console.log('✓ All 4 BriefCommercialUsage mappings verified');

// [TEST 6] Reverse Commercial Suitability Mappings
console.log('\n[TEST 6] Map CommercialSuitability to BriefCommercialUsage');
assert.strictEqual(Object.keys(COMMERCIAL_SUITABILITY_TO_BRIEF_USAGE).length, 4);
assert.strictEqual(
  mapCommercialSuitabilityToBriefUsage('Full IP Buyout'),
  'Full Global IP Buyout'
);
assert.strictEqual(
  mapCommercialSuitabilityToBriefUsage('Exclusive Commercial'),
  '1-Year Digital Exclusive'
);
assert.strictEqual(
  mapCommercialSuitabilityToBriefUsage('Standard Agency'),
  'Standard Agency License'
);
assert.strictEqual(
  mapCommercialSuitabilityToBriefUsage('Restricted Editorial'),
  'Restricted Social Use'
);
console.log('✓ Reverse suitability mappings verified');

// [TEST 7] Boundary and Unmapped Usage Rights
console.log('\n[TEST 7] Unmapped and boundary usage rights handling');
assert.strictEqual(mapBriefUsageToCommercialSuitability(''), null);
assert.strictEqual(mapBriefUsageToCommercialSuitability(undefined), null);
assert.strictEqual(mapBriefUsageToCommercialSuitability(null), null);
assert.strictEqual(mapBriefUsageToCommercialSuitability('Public Domain CC0'), null);
assert.strictEqual(mapCommercialSuitabilityToBriefUsage('Unrestricted Free'), null);
assert.strictEqual(mapCommercialSuitabilityToBriefUsage(undefined), null);
assert.strictEqual(mapCommercialSuitabilityToBriefUsage(null), null);
console.log('✓ Licensing boundary cases safely return null');

// [TEST 8] Commercial Suitability Rank and Hierarchy Evaluation
console.log('\n[TEST 8] isCreatorSuitabilityCompatible rank evaluation');
// A creator offering Full IP Buyout (Rank 4) can fulfill all commercial briefs:
assert.strictEqual(
  isCreatorSuitabilityCompatible('Full IP Buyout', 'Full Global IP Buyout'),
  true
);
assert.strictEqual(
  isCreatorSuitabilityCompatible('Full IP Buyout', '1-Year Digital Exclusive'),
  true
);
assert.strictEqual(
  isCreatorSuitabilityCompatible('Full IP Buyout', 'Standard Agency License'),
  true
);
assert.strictEqual(
  isCreatorSuitabilityCompatible('Full IP Buyout', 'Restricted Social Use'),
  true
);

// A creator offering Standard Agency (Rank 2) cannot fulfill a Full Buyout (Rank 4) or Exclusive (Rank 3):
assert.strictEqual(
  isCreatorSuitabilityCompatible('Standard Agency', 'Full Global IP Buyout'),
  false,
  'Standard Agency creator cannot satisfy Full Buyout brief'
);
assert.strictEqual(
  isCreatorSuitabilityCompatible('Standard Agency', '1-Year Digital Exclusive'),
  false,
  'Standard Agency creator cannot satisfy 1-Year Exclusive brief'
);
assert.strictEqual(
  isCreatorSuitabilityCompatible('Standard Agency', 'Standard Agency License'),
  true
);
assert.strictEqual(
  isCreatorSuitabilityCompatible('Standard Agency', 'Restricted Social Use'),
  true
);

// A creator limited to Restricted Editorial (Rank 1) cannot fulfill commercial briefs:
assert.strictEqual(
  isCreatorSuitabilityCompatible('Restricted Editorial', 'Standard Agency License'),
  false,
  'Editorial creator cannot satisfy standard agency commercial brief'
);
assert.strictEqual(
  isCreatorSuitabilityCompatible('Restricted Editorial', 'Full Global IP Buyout'),
  false,
  'Editorial creator cannot satisfy commercial buyout'
);

// Boundary checks
assert.strictEqual(isCreatorSuitabilityCompatible(null, 'Full Global IP Buyout'), false);
assert.strictEqual(isCreatorSuitabilityCompatible('Full IP Buyout', null), false);
assert.strictEqual(isCreatorSuitabilityCompatible('Full IP Buyout', ''), false);
console.log('✓ Creator suitability hierarchy and compatibility checks PASSED');

// [TEST 9] Licensing Guidance & Truthful Legal Notice
console.log('\n[TEST 9] Structured guidance and mandatory legal non-warranty notice');
const guidanceBuyout = getCommercialLicensingGuidance('Full Global IP Buyout');
assert.strictEqual(guidanceBuyout.briefUsage, 'Full Global IP Buyout');
assert.strictEqual(guidanceBuyout.mappedSuitability, 'Full IP Buyout');
assert.ok(guidanceBuyout.description.includes('Full commercial transfer'));
assert.ok(guidanceBuyout.legalNotice.includes('IMPORTANT LEGAL NOTICE'));
assert.ok(guidanceBuyout.legalNotice.includes('NOT constitute a warranty of non-infringement'));
assert.ok(guidanceBuyout.legalNotice.includes('formalized directly in the project agreement'));

const guidanceEmpty = getCommercialLicensingGuidance('');
assert.strictEqual(guidanceEmpty.mappedSuitability, null);
assert.ok(guidanceEmpty.description.includes('not specified'));
assert.strictEqual(guidanceEmpty.legalNotice, COMMERCIAL_USAGE_LEGAL_NOTICE);
console.log('✓ Licensing guidance and legal notice integrity PASSED');

console.log('\n=============================================');
console.log('ALL 9 DOMAIN ADAPTERS TEST SUITE CHECKS PASSED');
console.log('=============================================');
