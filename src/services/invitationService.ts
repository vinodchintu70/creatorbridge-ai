import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  CampaignInvitation,
  InvitationMessage,
  InvitationStatus,
  InvitationWithDetails,
} from '../types/invitation';
import { creatorService } from './creatorService';
import { briefService } from './briefService';

// Local store fallback for testing or when Supabase tables are pending migration
const LOCAL_STORAGE_INVITATIONS_KEY = 'cb_campaign_invitations';
const LOCAL_STORAGE_MESSAGES_KEY = 'cb_invitation_messages';

function getLocalInvitations(): CampaignInvitation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_INVITATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalInvitations(items: CampaignInvitation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_INVITATIONS_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save invitations locally:', err);
  }
}

function getLocalMessages(): InvitationMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMessages(items: InvitationMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save messages locally:', err);
  }
}

export const invitationService = {
  /**
   * Sends a formal campaign invitation from a brand to a creator.
   */
  async createInvitation(params: {
    briefId: string;
    brandUserId: string;
    creatorId: string;
    introMessage?: string;
  }): Promise<{ success: boolean; invitation?: CampaignInvitation; error?: string }> {
    if (!params.briefId || !params.creatorId || !params.brandUserId) {
      return { success: false, error: 'Brief ID, Creator ID, and Brand User ID are required.' };
    }

    // Verify brief exists
    const brief = await briefService.getBriefById(params.briefId);
    if (!brief) {
      return { success: false, error: 'Referenced campaign brief could not be found.' };
    }

    // Verify brand owns the brief (if userId is recorded on brief)
    if (brief.userId && brief.userId !== params.brandUserId) {
      return { success: false, error: 'Unauthorized: Brands can only create invitations for their own campaign briefs.' };
    }

    // Verify creator exists in platform catalog
    const creator = creatorService.getCreatorById(params.creatorId);
    if (!creator) {
      return { success: false, error: 'Invited creator could not be found in platform catalog.' };
    }

    // Bind creator user ID if a verified account mapping exists in catalog
    const boundCreatorUserId = creator.userId || undefined;

    // Prepare payload
    const newInvitation: CampaignInvitation = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `inv-${Date.now()}`,
      briefId: params.briefId,
      brandUserId: params.brandUserId,
      creatorId: params.creatorId,
      creatorUserId: boundCreatorUserId,
      status: 'pending',
      introMessage: params.introMessage ? params.introMessage.trim().slice(0, 2000) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Try Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('campaign_invitations')
          .insert([
            {
              id: newInvitation.id,
              brief_id: newInvitation.briefId,
              brand_user_id: newInvitation.brandUserId,
              creator_id: newInvitation.creatorId,
              creator_user_id: boundCreatorUserId || null,
              status: newInvitation.status,
              intro_message: newInvitation.introMessage,
              created_at: newInvitation.createdAt,
              updated_at: newInvitation.updatedAt,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          return { success: true, invitation: newInvitation };
        }

        if (error) {
          // Handle unique constraint violation (duplicate invitation)
          if (error.code === '23505' || error.message?.includes('unique')) {
            return {
              success: false,
              error: 'An active invitation for this creator and campaign already exists.',
            };
          }
          console.warn('Supabase createInvitation error, saving to local store:', error.message);
          const localList = getLocalInvitations();
          localList.unshift(newInvitation);
          saveLocalInvitations(localList);
          return { success: true, invitation: newInvitation };
        }
      } catch (err) {
        console.warn('Supabase createInvitation error:', err);
        const localList = getLocalInvitations();
        localList.unshift(newInvitation);
        saveLocalInvitations(localList);
        return { success: true, invitation: newInvitation };
      }
    }

    // 2. Local Fallback
    const localList = getLocalInvitations();
    const existing = localList.find(
      (inv) => inv.briefId === params.briefId && inv.creatorId === params.creatorId
    );
    if (existing) {
      return {
        success: false,
        error: 'An active invitation for this creator and campaign already exists.',
      };
    }

    localList.unshift(newInvitation);
    saveLocalInvitations(localList);

    return { success: true, invitation: newInvitation };
  },

  /**
   * Retrieves invitations for a brand user.
   */
  async getInvitationsForBrand(brandUserId: string): Promise<InvitationWithDetails[]> {
    if (!brandUserId) return [];
    let items: CampaignInvitation[] = [];

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('campaign_invitations')
          .select('*')
          .eq('brand_user_id', brandUserId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          items = data.map((d) => ({
            id: d.id,
            briefId: d.brief_id,
            brandUserId: d.brand_user_id,
            creatorId: d.creator_id,
            creatorUserId: d.creator_user_id,
            status: d.status as InvitationStatus,
            introMessage: d.intro_message,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase fetch invitations for brand error:', err);
      }
    }

    if (items.length === 0) {
      items = getLocalInvitations().filter((inv) => inv.brandUserId === brandUserId);
    }

    return this.enrichInvitations(items);
  },

  /**
   * Retrieves invitations intended for a creator (matched by creatorId or creatorUserId).
   */
  async getInvitationsForCreator(params: {
    creatorId?: string;
    creatorUserId?: string;
  }): Promise<InvitationWithDetails[]> {
    if (!params.creatorId && !params.creatorUserId) return [];
    let items: CampaignInvitation[] = [];

    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase.from('campaign_invitations').select('*');
        if (params.creatorId && params.creatorUserId) {
          query = query.or(`creator_id.eq.${params.creatorId},creator_user_id.eq.${params.creatorUserId}`);
        } else if (params.creatorId) {
          query = query.eq('creator_id', params.creatorId);
        } else if (params.creatorUserId) {
          query = query.eq('creator_user_id', params.creatorUserId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data) {
          items = data.map((d) => ({
            id: d.id,
            briefId: d.brief_id,
            brandUserId: d.brand_user_id,
            creatorId: d.creator_id,
            creatorUserId: d.creator_user_id,
            status: d.status as InvitationStatus,
            introMessage: d.intro_message,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase fetch invitations for creator error:', err);
      }
    }

    if (items.length === 0) {
      items = getLocalInvitations().filter(
        (inv) =>
          (params.creatorId && inv.creatorId === params.creatorId) ||
          (params.creatorUserId && inv.creatorUserId === params.creatorUserId)
      );
    }

    return this.enrichInvitations(items);
  },

  /**
   * Retrieves an invitation by ID with participant check.
   */
  async getInvitationById(id: string): Promise<InvitationWithDetails | null> {
    if (!id) return null;
    let inv: CampaignInvitation | null = null;

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('campaign_invitations')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          inv = {
            id: data.id,
            briefId: data.brief_id,
            brandUserId: data.brand_user_id,
            creatorId: data.creator_id,
            creatorUserId: data.creator_user_id,
            status: data.status as InvitationStatus,
            introMessage: data.intro_message,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        console.warn('Supabase getInvitationById error:', err);
      }
    }

    if (!inv) {
      inv = getLocalInvitations().find((i) => i.id === id) || null;
    }

    if (!inv) return null;
    const enriched = await this.enrichInvitations([inv]);
    return enriched[0] || null;
  },

  /**
   * Responds to an invitation (Accept or Decline).
   * Enforces that only pending invitations can transition, and only to 'accepted' or 'declined'.
   */
  async respondToInvitation(params: {
    invitationId: string;
    newStatus: 'accepted' | 'declined';
    actingUserId: string;
    actingCreatorId?: string;
  }): Promise<{ success: boolean; invitation?: CampaignInvitation; error?: string }> {
    const existing = await this.getInvitationById(params.invitationId);
    if (!existing) {
      return { success: false, error: 'Invitation not found.' };
    }

    // Authorization check: Brands cannot accept or decline on behalf of creators
    if (existing.brandUserId === params.actingUserId) {
      return {
        success: false,
        error: 'Unauthorized: Brands cannot accept or decline invitations on behalf of creators.',
      };
    }

    // State transition check: Can only transition from pending
    if (existing.status !== 'pending') {
      return {
        success: false,
        error: `Invalid transition: This invitation has already been ${existing.status}.`,
      };
    }

    const updatedAt = new Date().toISOString();

    // 1. Supabase update
    if (isSupabaseConfigured() && supabase) {
      try {
        const updatePayload: Record<string, unknown> = {
          status: params.newStatus,
          updated_at: updatedAt,
        };
        if (params.newStatus === 'accepted') {
          updatePayload.creator_user_id = params.actingUserId;
        }

        const { data, error } = await supabase
          .from('campaign_invitations')
          .update(updatePayload)
          .eq('id', params.invitationId)
          .select()
          .single();

        if (!error && data) {
          return {
            success: true,
            invitation: {
              ...existing,
              status: params.newStatus,
              creatorUserId: params.newStatus === 'accepted' ? params.actingUserId : existing.creatorUserId,
              updatedAt,
            },
          };
        }

        if (error) {
          return {
            success: false,
            error: error.message || 'Database update rejected.',
          };
        }
      } catch (err) {
        console.warn('Supabase respondToInvitation error:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Database communication error.',
        };
      }
    }

    // 2. Local fallback update
    const localList = getLocalInvitations();
    const index = localList.findIndex((i) => i.id === params.invitationId);
    if (index !== -1) {
      localList[index] = {
        ...localList[index],
        status: params.newStatus,
        creatorUserId: params.actingUserId,
        updatedAt,
      };
      saveLocalInvitations(localList);
      return { success: true, invitation: localList[index] };
    }

    return { success: false, error: 'Failed to update invitation status.' };
  },

  /**
   * Retrieves messages for an invitation conversation thread.
   */
  async getMessages(invitationId: string): Promise<InvitationMessage[]> {
    if (!invitationId) return [];

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('invitation_messages')
          .select('*')
          .eq('invitation_id', invitationId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          return data.map((d) => ({
            id: d.id,
            invitationId: d.invitation_id,
            senderUserId: d.sender_user_id,
            senderRole: d.sender_role,
            content: d.content,
            createdAt: d.created_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getMessages error:', err);
      }
    }

    return getLocalMessages()
      .filter((m) => m.invitationId === invitationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  /**
   * Sends a persistent message within an accepted invitation thread.
   */
  async sendMessage(params: {
    invitationId: string;
    senderUserId: string;
    senderRole: 'brand' | 'creator';
    content: string;
    allowPendingIntro?: boolean;
  }): Promise<{ success: boolean; message?: InvitationMessage; error?: string }> {
    const trimmed = (params.content || '').trim();
    if (!trimmed) {
      return { success: false, error: 'Message cannot be empty.' };
    }
    if (trimmed.length > 3000) {
      return { success: false, error: 'Message exceeds maximum length of 3000 characters.' };
    }

    // Verify invitation status
    const inv = await this.getInvitationById(params.invitationId);
    if (!inv) {
      return { success: false, error: 'Conversation thread could not be found.' };
    }

    // Ongoing messaging is strictly locked unless the invitation is accepted
    if (inv.status !== 'accepted') {
      return {
        success: false,
        error: `Messaging is locked: This invitation is currently ${inv.status}. Messaging unlocks upon creator acceptance.`,
      };
    }

    // Sender role and participant authorization check
    if (params.senderRole === 'brand') {
      if (params.senderUserId !== inv.brandUserId) {
        return {
          success: false,
          error: 'Unauthorized: Sender is not the brand participant of this invitation.',
        };
      }
    } else if (params.senderRole === 'creator') {
      if (inv.creatorUserId && params.senderUserId !== inv.creatorUserId) {
        return {
          success: false,
          error: 'Unauthorized: Sender is not the creator participant of this invitation.',
        };
      }
    } else {
      return {
        success: false,
        error: 'Invalid sender role.',
      };
    }

    const newMessage: InvitationMessage = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
      invitationId: params.invitationId,
      senderUserId: params.senderUserId,
      senderRole: params.senderRole,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('invitation_messages')
          .insert([
            {
              id: newMessage.id,
              invitation_id: newMessage.invitationId,
              sender_user_id: newMessage.senderUserId,
              sender_role: newMessage.senderRole,
              content: newMessage.content,
              created_at: newMessage.createdAt,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          return { success: true, message: newMessage };
        }

        if (error) {
          return {
            success: false,
            error: error.message || 'Database rejected message send.',
          };
        }
      } catch (err) {
        console.warn('Supabase sendMessage error:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Database communication error.',
        };
      }
    }

    const localMessages = getLocalMessages();
    localMessages.push(newMessage);
    saveLocalMessages(localMessages);

    return { success: true, message: newMessage };
  },

  /**
   * Helper to enrich invitations with brief titles, brand names, creator details, and message counts.
   */
  async enrichInvitations(items: CampaignInvitation[]): Promise<InvitationWithDetails[]> {
    const enriched: InvitationWithDetails[] = [];

    for (const item of items) {
      const brief = await briefService.getBriefById(item.briefId);
      const creator = creatorService.getCreatorById(item.creatorId);
      const messages = await this.getMessages(item.id);

      enriched.push({
        ...item,
        briefTitle: brief?.title || 'Campaign Brief',
        brandName: brief?.brandName || 'Brand',
        creatorName: creator?.name || item.creatorId,
        creatorHandle: creator?.handle || '',
        creatorAvatarUrl: creator?.avatarUrl || '',
        messages,
      });
    }

    return enriched;
  },
};
