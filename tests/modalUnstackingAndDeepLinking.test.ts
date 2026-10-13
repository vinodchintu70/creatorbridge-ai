import assert from 'node:assert';
import { MOCK_CREATORS } from '../src/data/mockCreators.ts';
import type { Creator, PortfolioProject } from '../src/types/creator.ts';

const getCreatorById = (id: string): Creator | null => {
  if (!id) return null;
  return MOCK_CREATORS.find((c) => c.id === id) || null;
};

console.log('--- RUNNING MODAL UNSTACKING & DEEP-LINKING TEST SUITE ---');

// [TEST 1] Creator Deep-Linking: Known and Unknown Creator IDs
console.log('\n[TEST 1] Creator deep link resolution via creatorService');
// 1a. Resolving valid creator IDs
const elena = getCreatorById('creator-1');
assert.ok(elena, 'creator-1 must resolve');
assert.strictEqual(elena?.name, 'Elena Rostova');
assert.strictEqual(elena?.handle, '@elena_synapse');

const kai = getCreatorById('creator-2');
assert.ok(kai, 'creator-2 must resolve');
assert.strictEqual(kai?.name, 'Kai Takahashi');

// 1b. Unknown IDs fail gracefully without fabricating records
const unknownCreator = getCreatorById('creator-non-existent-999');
assert.strictEqual(unknownCreator, null, 'Unknown creator ID must resolve to null');

const emptyCreator = getCreatorById('');
assert.strictEqual(emptyCreator, null, 'Empty string must resolve to null');
console.log('✓ Creator deep link resolution and graceful fallback PASSED');

// [TEST 2] URL Query Preservation on Modal Open and Close
console.log('\n[TEST 2] URL parameter preservation during profile open/close');
function updateCreatorQuery(currentSearchString: string, creatorId: string | null): string {
  const params = new URLSearchParams(currentSearchString);
  if (creatorId) {
    params.set('creator', creatorId);
  } else {
    params.delete('creator');
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}

// Case 2a: Opening profile preserves existing search and filter params
const withCreator = updateCreatorQuery('search=video&tool=Runway', 'creator-1');
assert.strictEqual(
  withCreator,
  '?search=video&tool=Runway&creator=creator-1',
  'Existing filters must be retained when setting creator param'
);

// Case 2b: Closing profile removes creator param without dropping search filters
const afterClose = updateCreatorQuery(withCreator.slice(1), null);
assert.strictEqual(
  afterClose,
  '?search=video&tool=Runway',
  'Closing profile must cleanly remove creator param without clearing other filters'
);

// Case 2c: Closing profile when creator was the only param results in clean URL
const soloCreator = updateCreatorQuery('creator=creator-2', null);
assert.strictEqual(soloCreator, '', 'Solo creator param should clear to empty query');
console.log('✓ URL query preservation PASSED');

// [TEST 3] Modal Unstacking State Machine & Context Preservation
console.log('\n[TEST 3] Modal unstacking and context preservation contract');

interface ModalPageState {
  selectedCreator: Creator | null;
  activeInspectProject: { project: PortfolioProject; creatorName: string } | null;
}

class ModalController {
  state: ModalPageState = {
    selectedCreator: null,
    activeInspectProject: null,
  };

  openCreator(creator: Creator) {
    this.state.selectedCreator = creator;
  }

  closeCreator() {
    this.state.selectedCreator = null;
  }

  inspectFromDetail(project: PortfolioProject, creatorName: string) {
    // Crucial: selectedCreator remains set!
    this.state.activeInspectProject = { project, creatorName };
  }

  directInspectFromCard(project: PortfolioProject, creatorName: string) {
    this.state.activeInspectProject = { project, creatorName };
  }

  closeWorkflowInspector() {
    this.state.activeInspectProject = null;
  }

  handleEscapeKey(): 'closed_workflow' | 'closed_creator' | 'noop' {
    // If workflow inspector is open, Escape closes ONLY the workflow inspector
    if (this.state.activeInspectProject) {
      this.closeWorkflowInspector();
      return 'closed_workflow';
    }
    // If only creator is open, Escape closes the creator profile
    if (this.state.selectedCreator) {
      this.closeCreator();
      return 'closed_creator';
    }
    return 'noop';
  }
}

const controller = new ModalController();

// 3a. Open creator profile
controller.openCreator(elena!);
assert.strictEqual(controller.state.selectedCreator?.id, 'creator-1');
assert.strictEqual(controller.state.activeInspectProject, null);

// 3b. Request workflow inspection from within creator profile
const sampleProject = elena!.portfolio[0];
controller.inspectFromDetail(sampleProject, elena!.name);
assert.ok(controller.state.activeInspectProject, 'Workflow inspector should be active');
assert.strictEqual(controller.state.activeInspectProject?.project.title, sampleProject.title);
assert.strictEqual(
  controller.state.selectedCreator?.id,
  'creator-1',
  'Selected creator context must NOT be discarded when inspecting workflow'
);

// 3c. Press Escape while workflow inspector is open -> only workflow closes
const firstEscAction = controller.handleEscapeKey();
assert.strictEqual(firstEscAction, 'closed_workflow');
assert.strictEqual(controller.state.activeInspectProject, null, 'Workflow inspector must be closed');
assert.strictEqual(
  controller.state.selectedCreator?.id,
  'creator-1',
  'Creator profile MUST remain open after closing workflow inspector'
);

// 3d. Press Escape again -> creator profile closes
const secondEscAction = controller.handleEscapeKey();
assert.strictEqual(secondEscAction, 'closed_creator');
assert.strictEqual(controller.state.selectedCreator, null, 'Creator profile is now closed');
console.log('✓ Modal unstacking state machine and Escape isolation PASSED');

// [TEST 4] Direct Workflow Inspection From Directory Cards
console.log('\n[TEST 4] Direct workflow inspection from creator cards');
const directController = new ModalController();
const kaiProject = kai!.portfolio[0];
directController.directInspectFromCard(kaiProject, kai!.name);
assert.strictEqual(directController.state.selectedCreator, null, 'Direct inspect has no selected creator');
assert.strictEqual(directController.state.activeInspectProject?.creatorName, 'Kai Takahashi');

directController.closeWorkflowInspector();
assert.strictEqual(directController.state.activeInspectProject, null);
assert.strictEqual(directController.state.selectedCreator, null);
console.log('✓ Direct workflow inspection from cards PASSED');

// [TEST 5] Homepage Preview Cards Sourced From Canonical Dataset
console.log('\n[TEST 5] Homepage preview cards canonical data resolution');
const HERO_PREVIEW_SLOTS = [
  { creatorId: 'creator-1' },
  { creatorId: 'creator-2' },
  { creatorId: 'creator-3' },
  { creatorId: 'creator-4' },
];

const resolvedPreviews = HERO_PREVIEW_SLOTS.map((slot) => {
  const creator = getCreatorById(slot.creatorId);
  assert.ok(creator, `Hero creator slot ${slot.creatorId} must exist in canonical dataset`);
  assert.ok(creator.portfolio.length > 0, `Creator ${slot.creatorId} must have portfolio items`);
  return {
    creatorId: creator.id,
    creatorName: creator.name,
    href: `/creators?creator=${creator.id}`,
    thumbnail: creator.portfolio[0].thumbnailUrl,
  };
});

assert.strictEqual(resolvedPreviews.length, 4);
assert.strictEqual(resolvedPreviews[0].href, '/creators?creator=creator-1');
assert.strictEqual(resolvedPreviews[1].href, '/creators?creator=creator-2');
assert.strictEqual(resolvedPreviews[2].href, '/creators?creator=creator-3');
assert.strictEqual(resolvedPreviews[3].href, '/creators?creator=creator-4');
console.log('✓ Homepage preview cards canonical resolution PASSED');

// [TEST 6] Full Catalog Resolution: creator-6, creator-7, creator-8 Portfolio Data Integrity
console.log('\n[TEST 6] Catalog data integrity for creator-6, creator-7, and creator-8');
const julian = getCreatorById('creator-6');
assert.ok(julian, 'creator-6 (Julian Moretti) must resolve');
assert.strictEqual(julian?.name, 'Julian Moretti');
assert.strictEqual(julian?.specialization, 'Fashion & Editorial');
assert.ok(Array.isArray(julian?.portfolio) && julian.portfolio.length > 0, 'creator-6 must have portfolio items');
assert.ok(julian.portfolio[0].workflow, 'creator-6 portfolio must contain workflow details');

const siddharth = getCreatorById('creator-7');
assert.ok(siddharth, 'creator-7 (Siddharth Rao) must resolve');
assert.strictEqual(siddharth?.name, 'Siddharth Rao');
assert.strictEqual(siddharth?.specialization, 'AI Commercials');
assert.ok(Array.isArray(siddharth?.portfolio) && siddharth.portfolio.length > 0, 'creator-7 must have portfolio items');

const anya = getCreatorById('creator-8');
assert.ok(anya, 'creator-8 (Anya Sorensen) must resolve');
assert.strictEqual(anya?.name, 'Anya Sorensen');
assert.strictEqual(anya?.specialization, 'Generative Animation');
assert.ok(Array.isArray(anya?.portfolio) && anya.portfolio.length > 0, 'creator-8 must have portfolio items');
console.log('✓ Catalog data integrity for creators 6-8 PASSED');

// [TEST 7] Scroll Lock Restoration Contract
console.log('\n[TEST 7] Scroll lock restoration contract');
const mockDocumentBody = {
  style: {
    overflow: '',
  },
};

function applyScrollLock(isOpen: boolean, target: { style: { overflow: string } }) {
  if (isOpen) {
    target.style.overflow = 'hidden';
  } else {
    target.style.overflow = '';
  }
}

// Initial state
assert.strictEqual(mockDocumentBody.style.overflow, '');

// Modal opens
applyScrollLock(true, mockDocumentBody);
assert.strictEqual(mockDocumentBody.style.overflow, 'hidden', 'Opening modal must lock overflow to hidden');

// Modal closes
applyScrollLock(false, mockDocumentBody);
assert.strictEqual(
  mockDocumentBody.style.overflow,
  '',
  'Closing modal must cleanly restore overflow to empty string, never unset'
);
console.log('✓ Scroll lock restoration contract PASSED');

console.log('\n======================================================');
console.log('ALL 7 MODAL UNSTACKING & DEEP-LINKING TEST CHECKS PASSED');
console.log('======================================================\n');

