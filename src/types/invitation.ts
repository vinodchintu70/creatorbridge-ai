export type InvitationStatus = 'pending' | 'accepted' | 'declined';
export type UserRole = 'brand' | 'creator';

export interface UserProfile {
  id: string; // matches auth.users.id
  role: UserRole;
  creatorId?: string; // if role === 'creator'
  brandName?: string; // if role === 'brand'
  displayName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CampaignInvitation {
  id: string;
  briefId: string;
  brandUserId: string;
  creatorId: string;
  creatorUserId?: string;
  status: InvitationStatus;
  introMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationMessage {
  id: string;
  invitationId: string;
  senderUserId: string;
  senderRole: UserRole;
  content: string;
  createdAt: string;
}

export interface InvitationWithDetails extends CampaignInvitation {
  briefTitle?: string;
  brandName?: string;
  creatorName?: string;
  creatorHandle?: string;
  creatorAvatarUrl?: string;
  messages?: InvitationMessage[];
}
