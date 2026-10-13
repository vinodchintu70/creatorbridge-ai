import assert from 'node:assert';
import {
  validateProfileIntegrity,
  validateBriefOwnershipForInvitation,
  validateInvitationTransition,
  validateProtectedFieldsImmutability,
  isDuplicateInvitation,
  validateMessageContent,
  validateMessageSender,
  isAuthorizedParticipant,
  TEST_ACCOUNTS,
} from '../src/utils/invitationRules.ts';
import type { CampaignInvitation, UserProfile } from '../src/types/invitation.ts';

console.log('--- RUNNING PHASE 6B: SECURITY & AUTHORIZATION TEST SUITE ---');

// ==============================================================================
// [TEST 1] Standard Test Accounts Definition
// ==============================================================================
console.log('\n[TEST 1] Verification of standard test accounts');
assert.strictEqual(TEST_ACCOUNTS.brand.role, 'brand');
assert.strictEqual(TEST_ACCOUNTS.creatorElena.role, 'creator');
assert.strictEqual(TEST_ACCOUNTS.creatorElena.creatorId, 'creator-1');
assert.strictEqual(TEST_ACCOUNTS.creatorKai.creatorId, 'creator-2');
console.log('✓ Standard test accounts configured correctly');

// ==============================================================================
// [TEST 2] Unauthenticated Access Rejection
// ==============================================================================
console.log('\n[TEST 2] Unauthenticated access rejection');
const unauthProfile = validateProfileIntegrity({
  userId: '',
  role: 'brand',
  displayName: 'Anonymous',
});
assert.strictEqual(unauthProfile.isValid, false, 'Profile creation without user ID must be rejected');

const unauthBriefInvite = validateBriefOwnershipForInvitation({
  brandUserId: '',
  briefOwnerUserId: 'brand-user-1',
  briefExists: true,
});
assert.strictEqual(unauthBriefInvite.isValid, false, 'Invitation creation without authenticated brand must be rejected');

const unauthMsgSender = validateMessageSender({
  invitation: {
    id: 'inv-1',
    briefId: 'brief-1',
    brandUserId: 'brand-1',
    creatorId: 'creator-1',
    creatorUserId: 'creator-user-1',
    status: 'accepted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  senderUserId: '',
  senderRole: 'brand',
});
assert.strictEqual(unauthMsgSender.isValid, false, 'Message send without authenticated user ID must be rejected');
console.log('✓ Unauthenticated access rejection PASSED');

// ==============================================================================
// [TEST 3] Role and Profile-Mapping Spoofing Prevention
// ==============================================================================
console.log('\n[TEST 3] Role and profile-mapping spoofing prevention');
// 3a. Brand cannot declare a creator ID
const brandWithCreatorId = validateProfileIntegrity({
  userId: 'user-brand-1',
  role: 'brand',
  displayName: 'Fake Studio',
  creatorId: 'creator-1', // Brand attempting to link creator record
});
assert.strictEqual(brandWithCreatorId.isValid, false, 'Brand profile with creatorId must be rejected');
assert.ok(brandWithCreatorId.error?.includes('cannot be linked to a creator ID'));

// 3b. Creator cannot declare a brand name
const creatorWithBrandName = validateProfileIntegrity({
  userId: 'user-creator-1',
  role: 'creator',
  displayName: 'Elena',
  creatorId: 'creator-1',
  brandName: 'Brand Agency Inc.', // Creator attempting brand role fields
});
assert.strictEqual(creatorWithBrandName.isValid, false, 'Creator profile declaring brandName must be rejected');

// 3c. Creator attempting to link to nonexistent creator record
const creatorNonexistent = validateProfileIntegrity({
  userId: 'user-creator-1',
  role: 'creator',
  displayName: 'Imposter',
  creatorId: 'creator-999',
  knownCreatorIds: new Set(['creator-1', 'creator-2']),
});
assert.strictEqual(creatorNonexistent.isValid, false, 'Nonexistent creator ID link must be rejected');

// 3d. Creator attempting to claim already-claimed creator profile
const claimedCreator = validateProfileIntegrity({
  userId: 'attacker-uuid',
  role: 'creator',
  displayName: 'Imposter Elena',
  creatorId: 'creator-1',
  claimedCreatorIds: new Set(['creator-1']), // creator-1 already claimed by Elena
});
assert.strictEqual(claimedCreator.isValid, false, 'Claiming already-claimed creator profile must be rejected');
assert.ok(claimedCreator.error?.includes('already claimed'));

// 3e. Immutability of role and creatorId on profile update
const existingElenaProfile: UserProfile = {
  id: 'elena-uuid',
  role: 'creator',
  creatorId: 'creator-1',
  displayName: 'Elena Rostova',
  createdAt: new Date().toISOString(),
};
const mutateRoleAttempt = validateProfileIntegrity({
  userId: 'elena-uuid',
  role: 'brand', // Creator attempting to switch role to brand
  displayName: 'Elena Studio',
  existingProfile: existingElenaProfile,
});
assert.strictEqual(mutateRoleAttempt.isValid, false, 'Role cannot be mutated on profile update');

const mutateCreatorIdAttempt = validateProfileIntegrity({
  userId: 'elena-uuid',
  role: 'creator',
  creatorId: 'creator-2', // Creator attempting to reassign creator mapping
  displayName: 'Elena Rostova',
  existingProfile: existingElenaProfile,
});
assert.strictEqual(mutateCreatorIdAttempt.isValid, false, 'Creator ID mapping cannot be mutated on profile update');
console.log('✓ Role and profile-mapping spoofing prevention PASSED');

// ==============================================================================
// [TEST 4] Brand Ownership of Briefs
// ==============================================================================
console.log('\n[TEST 4] Brand ownership of briefs');
// 4a. Brand inviting for their own brief
const ownBriefInvite = validateBriefOwnershipForInvitation({
  brandUserId: 'brand-user-1',
  briefOwnerUserId: 'brand-user-1',
  briefExists: true,
});
assert.strictEqual(ownBriefInvite.isValid, true, 'Brand may invite for their own brief');

// 4b. Brand inviting for someone else's brief
const foreignBriefInvite = validateBriefOwnershipForInvitation({
  brandUserId: 'attacker-brand',
  briefOwnerUserId: 'victim-brand',
  briefExists: true,
});
assert.strictEqual(foreignBriefInvite.isValid, false, 'Brand cannot invite for another brand’s brief');
assert.ok(foreignBriefInvite.error?.includes('only create invitations for their own'));

// 4c. Nonexistent brief
const missingBriefInvite = validateBriefOwnershipForInvitation({
  brandUserId: 'brand-user-1',
  briefExists: false,
});
assert.strictEqual(missingBriefInvite.isValid, false, 'Cannot invite for nonexistent brief');
console.log('✓ Brand ownership of briefs PASSED');

// ==============================================================================
// [TEST 5] Duplicate Invitation Detection
// ==============================================================================
console.log('\n[TEST 5] Duplicate invitation detection');
const existingInvitations: CampaignInvitation[] = [
  {
    id: 'inv-101',
    briefId: 'campaign-1',
    brandUserId: 'user-brand-1',
    creatorId: 'creator-1',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
assert.strictEqual(isDuplicateInvitation(existingInvitations, 'campaign-1', 'creator-1'), true);
assert.strictEqual(isDuplicateInvitation(existingInvitations, 'campaign-1', 'creator-2'), false);
assert.strictEqual(isDuplicateInvitation(existingInvitations, 'campaign-2', 'creator-1'), false);
console.log('✓ Duplicate invitation detection PASSED');

// ==============================================================================
// [TEST 6] Creator-Only Acceptance and Decline
// ==============================================================================
console.log('\n[TEST 6] Creator-only acceptance and decline');
const pendingInv: CampaignInvitation = {
  id: 'inv-200',
  briefId: 'campaign-1',
  brandUserId: 'brand-owner-uuid',
  creatorId: 'creator-1',
  creatorUserId: 'elena-uuid',
  status: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// 6a. Intended creator accepts
const creatorAccept = validateInvitationTransition({
  invitation: pendingInv,
  newStatus: 'accepted',
  actingUserId: 'elena-uuid',
  actingCreatorId: 'creator-1',
});
assert.strictEqual(creatorAccept.isValid, true, 'Intended creator can accept');

// 6b. Intended creator declines
const creatorDecline = validateInvitationTransition({
  invitation: pendingInv,
  newStatus: 'declined',
  actingUserId: 'elena-uuid',
  actingCreatorId: 'creator-1',
});
assert.strictEqual(creatorDecline.isValid, true, 'Intended creator can decline');

// 6c. Brand attempts to self-accept
const brandSelfAccept = validateInvitationTransition({
  invitation: pendingInv,
  newStatus: 'accepted',
  actingUserId: 'brand-owner-uuid',
  actingUserRole: 'brand',
});
assert.strictEqual(brandSelfAccept.isValid, false, 'Brand user cannot accept on behalf of creator');
assert.ok(brandSelfAccept.error?.includes('Brands cannot accept or decline'));

// 6d. Unrelated creator attempts to accept
const unrelatedCreatorAccept = validateInvitationTransition({
  invitation: pendingInv,
  newStatus: 'accepted',
  actingUserId: 'kai-uuid',
  actingCreatorId: 'creator-2', // Kai attempting to accept Elena's invitation
});
assert.strictEqual(unrelatedCreatorAccept.isValid, false, 'Unrelated creator cannot accept Elena’s invitation');
assert.ok(unrelatedCreatorAccept.error?.includes('Only the specifically invited creator'));
console.log('✓ Creator-only acceptance and decline PASSED');

// ==============================================================================
// [TEST 7] Protected Invitation Fields Immutability
// ==============================================================================
console.log('\n[TEST 7] Protected invitation fields immutability');
const originalInv: CampaignInvitation = {
  id: 'inv-300',
  briefId: 'campaign-7',
  brandUserId: 'brand-uuid-7',
  creatorId: 'creator-1',
  introMessage: 'Welcome to our project!',
  status: 'pending',
  createdAt: '2026-10-13T01:00:00.000Z',
  updatedAt: '2026-10-13T01:00:00.000Z',
};

// 7a. Mutating briefId
const mutateBriefId = validateProtectedFieldsImmutability({
  original: originalInv,
  updated: { ...originalInv, briefId: 'campaign-8' },
});
assert.strictEqual(mutateBriefId.isValid, false, 'briefId cannot be modified');

// 7b. Mutating brandUserId
const mutateBrandUser = validateProtectedFieldsImmutability({
  original: originalInv,
  updated: { ...originalInv, brandUserId: 'hijacked-brand' },
});
assert.strictEqual(mutateBrandUser.isValid, false, 'brandUserId cannot be modified');

// 7c. Mutating creatorId
const mutateCreator = validateProtectedFieldsImmutability({
  original: originalInv,
  updated: { ...originalInv, creatorId: 'creator-2' },
});
assert.strictEqual(mutateCreator.isValid, false, 'creatorId cannot be modified');

// 7d. Mutating introMessage
const mutateIntro = validateProtectedFieldsImmutability({
  original: originalInv,
  updated: { ...originalInv, introMessage: 'Tampered note' },
});
assert.strictEqual(mutateIntro.isValid, false, 'introMessage cannot be modified');
console.log('✓ Protected invitation fields immutability PASSED');

// ==============================================================================
// [TEST 8] Transition Immutability (Settled State Cannot Re-Open)
// ==============================================================================
console.log('\n[TEST 8] Settle state immutability');
const acceptedInv: CampaignInvitation = {
  ...pendingInv,
  status: 'accepted',
};
const declineAccepted = validateInvitationTransition({
  invitation: acceptedInv,
  newStatus: 'declined',
  actingUserId: 'elena-uuid',
  actingCreatorId: 'creator-1',
});
assert.strictEqual(declineAccepted.isValid, false, 'Accepted invitation cannot transition to declined');

const revertAccepted = validateInvitationTransition({
  invitation: acceptedInv,
  newStatus: 'pending',
  actingUserId: 'elena-uuid',
  actingCreatorId: 'creator-1',
});
assert.strictEqual(revertAccepted.isValid, false, 'Accepted invitation cannot revert to pending');

const declinedInv: CampaignInvitation = {
  ...pendingInv,
  status: 'declined',
};
const acceptDeclined = validateInvitationTransition({
  invitation: declinedInv,
  newStatus: 'accepted',
  actingUserId: 'elena-uuid',
  actingCreatorId: 'creator-1',
});
assert.strictEqual(acceptDeclined.isValid, false, 'Declined invitation cannot transition to accepted');
console.log('✓ Settle state immutability PASSED');

// ==============================================================================
// [TEST 9] Message Restrictions for Pending and Declined Invitations
// ==============================================================================
console.log('\n[TEST 9] Message restrictions for pending and declined invitations');
// 9a. Pending invitation message lock
const pendingMsgCheck = validateMessageContent({
  content: 'Hello, can you start today?',
  invitationStatus: 'pending',
});
assert.strictEqual(pendingMsgCheck.isValid, false, 'Messages cannot be sent on pending invitations');
assert.ok(pendingMsgCheck.error?.includes('Messaging is locked'));

// 9b. Declined invitation message lock
const declinedMsgCheck = validateMessageContent({
  content: 'Why did you decline?',
  invitationStatus: 'declined',
});
assert.strictEqual(declinedMsgCheck.isValid, false, 'Messages cannot be sent on declined invitations');

// 9c. Accepted invitation permits messaging
const acceptedMsgCheck = validateMessageContent({
  content: 'Great to be working together!',
  invitationStatus: 'accepted',
});
assert.strictEqual(acceptedMsgCheck.isValid, true, 'Messages permitted on accepted invitations');
console.log('✓ Message restrictions for pending and declined invitations PASSED');

// ==============================================================================
// [TEST 10] Message Content Bounds
// ==============================================================================
console.log('\n[TEST 10] Message content bounds');
assert.strictEqual(
  validateMessageContent({ content: '   ', invitationStatus: 'accepted' }).isValid,
  false,
  'Empty content rejected'
);
assert.strictEqual(
  validateMessageContent({ content: 'Z'.repeat(3001), invitationStatus: 'accepted' }).isValid,
  false,
  'Content > 3000 chars rejected'
);
assert.strictEqual(
  validateMessageContent({ content: 'Z'.repeat(3000), invitationStatus: 'accepted' }).isValid,
  true,
  'Content <= 3000 chars accepted'
);
console.log('✓ Message content bounds PASSED');

// ==============================================================================
// [TEST 11] Participant Messaging Authorization & Sender Role Verification
// ==============================================================================
console.log('\n[TEST 11] Participant messaging authorization & sender role verification');
const activeConversationInv: CampaignInvitation = {
  id: 'inv-400',
  briefId: 'campaign-12',
  brandUserId: 'brand-user-uuid',
  creatorId: 'creator-1',
  creatorUserId: 'elena-user-uuid',
  status: 'accepted',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// 11a. Brand sends message with matching brand role
const validBrandSender = validateMessageSender({
  invitation: activeConversationInv,
  senderUserId: 'brand-user-uuid',
  senderRole: 'brand',
});
assert.strictEqual(validBrandSender.isValid, true, 'Brand participant sending as brand is authorized');

// 11b. Brand user attempts to spoof creator role
const brandSpoofingCreator = validateMessageSender({
  invitation: activeConversationInv,
  senderUserId: 'brand-user-uuid',
  senderRole: 'creator', // Brand pretending to be creator
});
assert.strictEqual(brandSpoofingCreator.isValid, false, 'Brand user spoofing creator role must be rejected');

// 11c. Creator sends message with matching creator role
const validCreatorSender = validateMessageSender({
  invitation: activeConversationInv,
  senderUserId: 'elena-user-uuid',
  senderRole: 'creator',
  senderCreatorId: 'creator-1',
});
assert.strictEqual(validCreatorSender.isValid, true, 'Creator participant sending as creator is authorized');

// 11d. Creator user attempts to spoof brand role
const creatorSpoofingBrand = validateMessageSender({
  invitation: activeConversationInv,
  senderUserId: 'elena-user-uuid',
  senderRole: 'brand', // Creator pretending to be brand
});
assert.strictEqual(creatorSpoofingBrand.isValid, false, 'Creator user spoofing brand role must be rejected');
console.log('✓ Sender role validation PASSED');

// ==============================================================================
// [TEST 12] Unauthorized Third-Party Message Reads & Writes
// ==============================================================================
console.log('\n[TEST 12] Unauthorized third-party message reads & writes');
// 12a. Third party sending message
const thirdPartySender = validateMessageSender({
  invitation: activeConversationInv,
  senderUserId: 'stranger-user-uuid',
  senderRole: 'creator',
  senderCreatorId: 'creator-5',
});
assert.strictEqual(thirdPartySender.isValid, false, 'Third party cannot send message');

// 12b. Third party reading conversation
const thirdPartyReader = isAuthorizedParticipant({
  invitation: activeConversationInv,
  actingUserId: 'stranger-user-uuid',
  actingCreatorId: 'creator-5',
});
assert.strictEqual(thirdPartyReader, false, 'Third party cannot read conversation');

// 12c. Real participants reading conversation
assert.strictEqual(
  isAuthorizedParticipant({
    invitation: activeConversationInv,
    actingUserId: 'brand-user-uuid',
  }),
  true,
  'Brand participant can read'
);
assert.strictEqual(
  isAuthorizedParticipant({
    invitation: activeConversationInv,
    actingUserId: 'elena-user-uuid',
    actingCreatorId: 'creator-1',
  }),
  true,
  'Creator participant can read'
);
console.log('✓ Third-party read & write isolation PASSED');

// ==============================================================================
// [TEST 13] Explicit Creator Account Claiming Authorization (Risk A)
// ==============================================================================
console.log('\n[TEST 13] Explicit creator account claiming authorization (Risk A)');
// 13a. Public registration attempting to claim catalog creator
const publicSignupClaim = validateProfileIntegrity({
  userId: 'public-user-uuid',
  role: 'creator',
  displayName: 'Public Creator',
  creatorId: 'creator-1',
  isPublicSignup: true,
});
assert.strictEqual(publicSignupClaim.isValid, false, 'Public registration cannot claim catalog creator');
assert.ok(publicSignupClaim.error?.includes('Public registration cannot claim catalog creator IDs'));

// 13b. Unassigned user attempting to link catalog creator without verified ownership
const unassignedClaim = validateProfileIntegrity({
  userId: 'unassigned-user-uuid',
  role: 'creator',
  displayName: 'Imposter Elena',
  creatorId: 'creator-1',
  verifiedCreatorUserId: 'other-user-uuid',
});
assert.strictEqual(unassignedClaim.isValid, false, 'Unassigned user cannot link catalog creator');
assert.ok(unassignedClaim.error?.includes('is not verified or assigned'));

// 13c. Trusted administrative assignment of Elena's profile
const authorizedAssignment = validateProfileIntegrity({
  userId: 'elena-real-uuid',
  role: 'creator',
  displayName: 'Elena Rostova',
  creatorId: 'creator-1',
  verifiedCreatorUserId: 'elena-real-uuid', // Authoritatively assigned
});
assert.strictEqual(authorizedAssignment.isValid, true, 'Authoritatively assigned creator profile is accepted');

// 13d. Independent public creator registration without catalog claiming
const independentCreatorSignup = validateProfileIntegrity({
  userId: 'new-creator-uuid',
  role: 'creator',
  displayName: 'New Independent Artist',
  isPublicSignup: true,
});
assert.strictEqual(independentCreatorSignup.isValid, true, 'Independent creator registration without catalog claim is accepted');
console.log('✓ Explicit creator account claiming authorization PASSED');

// ==============================================================================
// [TEST 14] Status-Only Transition Enforcement & Side-Effect Prevention (Risk B)
// ==============================================================================
console.log('\n[TEST 14] Status-only transition enforcement & side-effect prevention (Risk B)');
// 14a. Re-submitting pending to pending (no-op status update or side-effect exploit)
const pendingToPending = validateInvitationTransition({
  invitation: pendingInv,
  newStatus: 'pending',
  actingUserId: 'elena-uuid',
  actingCreatorId: 'creator-1',
});
assert.strictEqual(pendingToPending.isValid, false, 'Pending-to-pending status update must be rejected');

// 14b. Re-submitting accepted to accepted
const acceptedToAccepted = validateInvitationTransition({
  invitation: acceptedInv,
  newStatus: 'accepted',
  actingUserId: 'elena-uuid',
  actingCreatorId: 'creator-1',
});
assert.strictEqual(acceptedToAccepted.isValid, false, 'Accepted-to-accepted status update must be rejected');
console.log('✓ Status-only transition enforcement PASSED');

// ==============================================================================
// [TEST 15] Permanent Recipient Binding & Unbound Claim Protection (Risk B)
// ==============================================================================
console.log('\n[TEST 15] Permanent recipient binding & unbound claim protection');
// 15a. Bound invitation: Different creator cannot accept even if claiming same creator ID
const boundInvitation: CampaignInvitation = {
  id: 'inv-bound-1',
  briefId: 'campaign-20',
  brandUserId: 'brand-owner-uuid',
  creatorId: 'creator-1',
  creatorUserId: 'elena-real-uuid', // Permanently bound to Elena
  status: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const imposterAcceptBound = validateInvitationTransition({
  invitation: boundInvitation,
  newStatus: 'accepted',
  actingUserId: 'imposter-uuid',
  actingCreatorId: 'creator-1', // Imposter passing creator-1 ID
});
assert.strictEqual(imposterAcceptBound.isValid, false, 'Imposter user cannot accept invitation bound to Elena');
assert.ok(imposterAcceptBound.error?.includes('specifically invited creator'));

// 15b. Unbound invitation: Creator cannot accept by matching public creator ID alone
const unboundInvitation: CampaignInvitation = {
  id: 'inv-unbound-1',
  briefId: 'campaign-20',
  brandUserId: 'brand-owner-uuid',
  creatorId: 'creator-2',
  creatorUserId: undefined, // Unbound catalog profile
  status: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const unverifiedAcceptUnbound = validateInvitationTransition({
  invitation: unboundInvitation,
  newStatus: 'accepted',
  actingUserId: 'unverified-kai-uuid',
  actingCreatorId: 'creator-2', // Matches creatorId, but not verified owner
  verifiedCreatorUserId: undefined, // Unverified
});
assert.strictEqual(unverifiedAcceptUnbound.isValid, false, 'Matching public creator ID alone without verified ownership is rejected');

// 15c. Unbound invitation: Verified owner can accept
const verifiedAcceptUnbound = validateInvitationTransition({
  invitation: unboundInvitation,
  newStatus: 'accepted',
  actingUserId: 'verified-kai-uuid',
  actingCreatorId: 'creator-2',
  verifiedCreatorUserId: 'verified-kai-uuid', // Verified owner
});
assert.strictEqual(verifiedAcceptUnbound.isValid, true, 'Verified owner of catalog profile can accept unbound invitation');
console.log('✓ Permanent recipient binding & unbound claim protection PASSED');

// ==============================================================================
// [TEST 16] Creator Profile Immutability & Reassignment Prevention (Issue 1)
// ==============================================================================
console.log('\n[TEST 16] Creator profile immutability & reassignment prevention');
const existingCreatorProfile: UserProfile = {
  id: 'elena-uuid',
  role: 'creator',
  creatorId: 'creator-1',
  displayName: 'Elena Rostova',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// 16a. Attempting to modify creatorId on existing profile
const updateCreatorId = validateProfileIntegrity({
  userId: 'elena-uuid',
  role: 'creator',
  displayName: 'Elena Rostova',
  creatorId: 'creator-2', // Attempting to switch to Kai's profile
  existingProfile: existingCreatorProfile,
});
assert.strictEqual(updateCreatorId.isValid, false, 'Altering creatorId on existing profile must be rejected');
assert.ok(updateCreatorId.error?.includes('Creator mapping cannot be altered'));

// 16b. Attempting to un-map creatorId on existing profile
const unmapCreatorId = validateProfileIntegrity({
  userId: 'elena-uuid',
  role: 'creator',
  displayName: 'Elena Rostova',
  creatorId: undefined, // Attempting to un-link
  existingProfile: existingCreatorProfile,
});
assert.strictEqual(unmapCreatorId.isValid, false, 'Unlinking creatorId on existing profile must be rejected');
assert.ok(unmapCreatorId.error?.includes('Creator mapping cannot be altered'));

// 16c. Attempting to change role from creator to brand
const changeRole = validateProfileIntegrity({
  userId: 'elena-uuid',
  role: 'brand',
  displayName: 'Elena Agency',
  existingProfile: existingCreatorProfile,
});
assert.strictEqual(changeRole.isValid, false, 'Modifying user role after profile establishment must be rejected');
assert.ok(changeRole.error?.includes('Role cannot be modified'));
console.log('✓ Creator profile immutability & reassignment prevention PASSED');

console.log('\n=============================================================');
console.log('ALL 16 PHASE 6B SECURITY & AUTHORIZATION TESTS PASSED');
console.log('=============================================================\n');


