import type {
  InvitationStatus,
  UserRole,
  CampaignInvitation,
  UserProfile,
} from '../types/invitation';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Standard test accounts for Phase 6B verification.
 */
export const TEST_ACCOUNTS = {
  brand: {
    email: 'brand@creatorbridge.test',
    password: 'TestPassword123!',
    displayName: 'Lumina Brand Studio',
    brandName: 'Lumina Labs',
    role: 'brand' as UserRole,
  },
  creatorElena: {
    email: 'elena@creatorbridge.test',
    password: 'TestPassword123!',
    displayName: 'Elena Rostova',
    creatorId: 'creator-1',
    role: 'creator' as UserRole,
  },
  creatorKai: {
    email: 'kai@creatorbridge.test',
    password: 'TestPassword123!',
    displayName: 'Kai Takahashi',
    creatorId: 'creator-2',
    role: 'creator' as UserRole,
  },
};

/**
 * Validates user profile creation and ensures integrity between role and associated fields.
 * Prevents client-side role elevation and unauthorized creator record claiming.
 */
export function validateProfileIntegrity(params: {
  userId: string;
  role: UserRole;
  displayName: string;
  creatorId?: string;
  brandName?: string;
  userEmail?: string;
  isPublicSignup?: boolean;
  verifiedCreatorUserId?: string;
  existingProfile?: UserProfile;
  claimedCreatorIds?: Set<string>;
  knownCreatorIds?: Set<string>;
}): ValidationResult {
  if (!params.userId) {
    return { isValid: false, error: 'User ID is required.' };
  }

  if (params.role !== 'brand' && params.role !== 'creator') {
    return { isValid: false, error: 'Invalid role: Must be either "brand" or "creator".' };
  }

  // Brand profile constraints
  if (params.role === 'brand') {
    if (params.creatorId) {
      return { isValid: false, error: 'Brand profiles cannot be linked to a creator ID.' };
    }
  }

  // Creator profile constraints
  if (params.role === 'creator') {
    if (params.brandName) {
      return { isValid: false, error: 'Creator profiles cannot declare a brand name.' };
    }
    if (params.creatorId) {
      // Unrestricted public registration cannot claim catalog creator IDs
      if (params.isPublicSignup) {
        return {
          isValid: false,
          error: 'Unauthorized: Public registration cannot claim catalog creator IDs. Profiles must be assigned via trusted provisioning.',
        };
      }
      // Validate catalog existence if set is provided
      if (params.knownCreatorIds && !params.knownCreatorIds.has(params.creatorId)) {
        return { isValid: false, error: `Referenced creator "${params.creatorId}" does not exist in catalog.` };
      }
      // Explicit trusted verification: Creator record must be assigned to this user in catalog
      if (
        params.verifiedCreatorUserId !== undefined &&
        params.verifiedCreatorUserId !== params.userId
      ) {
        return {
          isValid: false,
          error: `Unauthorized: Creator profile "${params.creatorId}" is not verified or assigned to this account.`,
        };
      }
      // Validate single-ownership claim
      if (
        params.claimedCreatorIds &&
        params.claimedCreatorIds.has(params.creatorId) &&
        params.existingProfile?.creatorId !== params.creatorId
      ) {
        return { isValid: false, error: `Creator "${params.creatorId}" is already claimed by another authenticated account.` };
      }
    }
  }

  // Immutability on UPDATE
  if (params.existingProfile) {
    if (params.existingProfile.role !== params.role) {
      return { isValid: false, error: 'Role cannot be modified after initial profile establishment.' };
    }
    if (
      params.existingProfile.creatorId &&
      params.existingProfile.creatorId !== params.creatorId
    ) {
      return { isValid: false, error: 'Creator mapping cannot be altered after profile establishment.' };
    }
  }

  return { isValid: true };
}

/**
 * Validates that an invitation is only created against a brief owned by the authenticated brand.
 */
export function validateBriefOwnershipForInvitation(params: {
  brandUserId: string;
  briefOwnerUserId?: string;
  briefExists: boolean;
}): ValidationResult {
  if (!params.brandUserId) {
    return { isValid: false, error: 'Unauthenticated: Brand user ID is required.' };
  }

  if (!params.briefExists) {
    return { isValid: false, error: 'Referenced campaign brief does not exist.' };
  }

  if (params.briefOwnerUserId && params.briefOwnerUserId !== params.brandUserId) {
    return { isValid: false, error: 'Unauthorized: Brands can only create invitations for their own campaign briefs.' };
  }

  return { isValid: true };
}

/**
 * Validates state transitions for campaign invitations.
 * Strict rules:
 * 1. Only pending invitations can be updated.
 * 2. Status can only transition to 'accepted' or 'declined'.
 * 3. Brands cannot accept or decline on behalf of creators.
 * 4. Only the specifically intended creator can accept or decline.
 */
export function validateInvitationTransition(params: {
  invitation: CampaignInvitation;
  newStatus: InvitationStatus;
  actingUserId: string;
  actingUserRole?: UserRole;
  actingCreatorId?: string;
  verifiedCreatorUserId?: string;
}): ValidationResult {
  if (!params.actingUserId) {
    return { isValid: false, error: 'Unauthenticated: User session is required to respond to invitations.' };
  }

  // Brand spoofing check
  if (params.actingUserId === params.invitation.brandUserId || params.actingUserRole === 'brand') {
    return {
      isValid: false,
      error: 'Unauthorized: Brands cannot accept or decline invitations on behalf of creators.',
    };
  }

  // Already settled check
  if (params.invitation.status !== 'pending') {
    return {
      isValid: false,
      error: `Invalid transition: This invitation has already been ${params.invitation.status} and cannot be modified.`,
    };
  }

  // Target status check
  if (params.newStatus !== 'accepted' && params.newStatus !== 'declined') {
    return {
      isValid: false,
      error: `Invalid transition: Status can only transition from pending to "accepted" or "declined".`,
    };
  }

  // Verify that acting user is the specifically intended creator:
  // 1. If invitation was bound to a specific creator user ID, ONLY that account can accept/decline.
  // 2. If invitation was initially pending without a bound creator user ID, matching public creator ID
  //    alone is NOT permitted: the acting user must have verified ownership of that creator record.
  let isIntendedCreator = false;
  if (params.invitation.creatorUserId) {
    isIntendedCreator = params.actingUserId === params.invitation.creatorUserId;
  } else {
    const matchesCatalogCreator = Boolean(
      params.actingCreatorId && params.actingCreatorId === params.invitation.creatorId
    );
    const hasVerifiedOwnership = Boolean(
      params.verifiedCreatorUserId && params.verifiedCreatorUserId === params.actingUserId
    );
    isIntendedCreator = matchesCatalogCreator && hasVerifiedOwnership;
  }

  if (!isIntendedCreator) {
    return {
      isValid: false,
      error: 'Unauthorized: Only the specifically invited creator account can respond to this invitation.',
    };
  }

  return { isValid: true };
}

/**
 * Validates that protected invitation fields are immutable on update.
 */
export function validateProtectedFieldsImmutability(params: {
  original: CampaignInvitation;
  updated: CampaignInvitation;
}): ValidationResult {
  if (params.original.id !== params.updated.id) {
    return { isValid: false, error: 'Invitation ID cannot be altered.' };
  }
  if (params.original.briefId !== params.updated.briefId) {
    return { isValid: false, error: 'Associated campaign brief ID cannot be altered.' };
  }
  if (params.original.brandUserId !== params.updated.brandUserId) {
    return { isValid: false, error: 'Brand owner user ID cannot be altered.' };
  }
  if (params.original.creatorId !== params.updated.creatorId) {
    return { isValid: false, error: 'Invited creator ID cannot be altered.' };
  }
  if (params.original.introMessage !== params.updated.introMessage) {
    return { isValid: false, error: 'Introductory message cannot be altered on invitation update.' };
  }
  if (params.original.createdAt !== params.updated.createdAt) {
    return { isValid: false, error: 'Creation timestamp cannot be altered.' };
  }

  return { isValid: true };
}

/**
 * Checks if an active invitation already exists for a specific brief and creator.
 */
export function isDuplicateInvitation(
  existingInvitations: CampaignInvitation[],
  briefId: string,
  creatorId: string
): boolean {
  return existingInvitations.some(
    (inv) => inv.briefId === briefId && inv.creatorId === creatorId
  );
}

/**
 * Validates message content and ensures conversation is unlocked.
 * Ongoing messaging unlocks strictly upon creator acceptance.
 */
export function validateMessageContent(params: {
  content: string;
  invitationStatus: InvitationStatus;
}): ValidationResult {
  const trimmed = (params.content || '').trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Message content cannot be empty.',
    };
  }

  if (trimmed.length > 3000) {
    return {
      isValid: false,
      error: 'Message exceeds maximum length of 3000 characters.',
    };
  }

  if (params.invitationStatus !== 'accepted') {
    return {
      isValid: false,
      error: `Messaging is locked: This invitation is currently ${params.invitationStatus}. Messaging unlocks upon creator acceptance.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates that a message sender is an authorized participant and their role matches trusted database records.
 */
export function validateMessageSender(params: {
  invitation: CampaignInvitation;
  senderUserId: string;
  senderRole: UserRole;
  senderCreatorId?: string;
}): ValidationResult {
  if (!params.senderUserId) {
    return { isValid: false, error: 'Unauthenticated: Sender user ID is required.' };
  }

  // Invitation must be accepted
  if (params.invitation.status !== 'accepted') {
    return {
      isValid: false,
      error: `Messaging is locked: Messages cannot be sent on ${params.invitation.status} invitations.`,
    };
  }

  // Brand role validation
  if (params.senderRole === 'brand') {
    if (params.senderUserId !== params.invitation.brandUserId) {
      return { isValid: false, error: 'Unauthorized: Sender is not the brand participant of this invitation.' };
    }
    return { isValid: true };
  }

  // Creator role validation
  if (params.senderRole === 'creator') {
    const isCreatorParticipant =
      (params.invitation.creatorUserId && params.senderUserId === params.invitation.creatorUserId) ||
      (params.senderCreatorId && params.senderCreatorId === params.invitation.creatorId);

    if (!isCreatorParticipant) {
      return { isValid: false, error: 'Unauthorized: Sender is not the creator participant of this invitation.' };
    }
    return { isValid: true };
  }

  return { isValid: false, error: 'Unauthorized sender role.' };
}

/**
 * Evaluates whether an authenticated user is an authorized participant in an invitation.
 */
export function isAuthorizedParticipant(params: {
  invitation: CampaignInvitation;
  actingUserId: string;
  actingCreatorId?: string;
}): boolean {
  if (!params.actingUserId) return false;

  // 1. Authorized as the inviting brand
  if (params.actingUserId === params.invitation.brandUserId) {
    return true;
  }

  // 2. Authorized as the direct creator user
  if (params.invitation.creatorUserId && params.actingUserId === params.invitation.creatorUserId) {
    return true;
  }

  // 3. Authorized matching creator profile
  if (params.actingCreatorId && params.actingCreatorId === params.invitation.creatorId) {
    return true;
  }

  return false;
}
