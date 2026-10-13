import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { BriefFormData } from '@/types/brief';
import { isHistoricalUSDBrief } from '@/utils/formatCurrency';
import { briefStorage } from './briefStorage';
import { reconcileBriefRecords } from '@/utils/briefReconciliation';

export { reconcileBriefRecords };

export const briefService = {
  /**
   * Publishes a brief to local storage and syncs to Supabase if configured.
   */
  async publishBrief(data: BriefFormData): Promise<BriefFormData> {
    // 1. Always write to local demonstration store
    const localSaved = briefStorage.publishBrief({
      ...data,
      currency: data.currency || 'INR',
    });
    let savedRemotely = false;

    // 2. If Supabase is connected, sync to remote database
    if (isSupabaseConfigured() && supabase) {
      try {
        let currentUserId: string | null = localSaved.userId || null;
        try {
          const { data: authUserData } = await supabase.auth.getUser();
          if (authUserData?.user?.id) {
            currentUserId = authUserData.user.id;
          }
        } catch {
          // ignore session fetch errors
        }

        const basePayload: Record<string, unknown> = {
          id: localSaved.id,
          user_id: currentUserId,
          title: localSaved.title,
          brand_name: localSaved.brandName,
          objective: localSaved.objective,
          target_audience: localSaved.targetAudience,
          channels: localSaved.channels,
          content_type: localSaved.contentType,
          creative_style: localSaved.creativeStyle,
          aspect_ratio: localSaved.aspectRatio,
          duration: localSaved.duration,
          deliverables_count: localSaved.deliverablesCount,
          preferredTools: localSaved.preferredTools,
          required_skills: localSaved.requiredSkills,
          commercial_usage: localSaved.commercialUsage,
          usage_territory: localSaved.usageTerritory,
          usage_duration: localSaved.usageDuration,
          model_safety_policy: localSaved.modelSafetyPolicy,
          budget_min: localSaved.budgetMin,
          budget_max: localSaved.budgetMax,
          deadline: localSaved.deadline,
          creative_constraints: localSaved.creativeConstraints,
          reference_links: localSaved.referenceLinks,
          invited_creator_id: localSaved.invitedCreatorId || null,
          status: 'published',
          created_at: localSaved.createdAt,
          updated_at: localSaved.updatedAt,
        };

        // Try inserting with currency column (if schema migration has been applied)
        let insertRes = await supabase.from('campaign_briefs').insert([
          {
            ...basePayload,
            currency: localSaved.currency || 'INR',
          },
        ]);

        // If currency column does not exist yet on remote database, fall back safely to base payload
        if (
          insertRes.error &&
          insertRes.error.message &&
          (insertRes.error.message.includes('currency') || insertRes.error.code === 'PGRST204')
        ) {
          insertRes = await supabase.from('campaign_briefs').insert([basePayload]);
        }

        const error = insertRes.error;

        if (error) {
          if (error.code === '23505') {
            // A record with this primary key ID already exists in Supabase.
            // Verify that the existing remote record is demonstrably the exact same brief
            // before treating it as already synchronized.
            try {
              const { data: existingBrief } = await supabase
                .from('campaign_briefs')
                .select('id, title, brand_name')
                .eq('id', localSaved.id)
                .single();

              if (
                existingBrief &&
                existingBrief.id === localSaved.id &&
                existingBrief.title === localSaved.title &&
                existingBrief.brand_name === localSaved.brandName
              ) {
                // Verified: Exact matching brief already persisted remotely (idempotent retry)
                savedRemotely = true;
              } else {
                console.warn(
                  'Duplicate key 23505 encountered, but existing remote brief does not match published brief:',
                  localSaved.id
                );
                savedRemotely = false;
              }
            } catch {
              savedRemotely = false;
            }
          } else {
            console.warn('Supabase publishBrief warning (using local fallback):', error.message);
          }
        } else {
          savedRemotely = true;
        }
      } catch (err) {
        console.warn('Supabase sync error (using local fallback):', err);
      }
    }

    return {
      ...localSaved,
      savedRemotely,
    };
  },

  /**
   * Retrieves published briefs, reconciling remote Supabase records with local published briefs.
   */
  async getPublishedBriefs(): Promise<BriefFormData[]> {
    const localPublished = briefStorage.getPublishedBriefs();
    let remoteBriefs: BriefFormData[] = [];

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('campaign_briefs')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          remoteBriefs = data.map((row) => {
            const currency: 'INR' | 'USD' =
              row.currency || (isHistoricalUSDBrief(row.created_at) ? 'USD' : 'INR');
            return {
              id: row.id,
              userId: row.user_id || undefined,
              title: row.title,
              brandName: row.brand_name,
              objective: row.objective,
              targetAudience: row.target_audience,
              channels: row.channels || [],
              contentType: row.content_type,
              creativeStyle: row.creative_style,
              aspectRatio: row.aspect_ratio,
              duration: row.duration,
              deliverablesCount: row.deliverables_count,
              preferredTools: row.preferred_tools || [],
              requiredSkills: row.required_skills || [],
              commercialUsage: row.commercial_usage,
              usageTerritory: row.usage_territory,
              usageDuration: row.usage_duration,
              modelSafetyPolicy: row.model_safety_policy,
              budgetMin: Number(row.budget_min),
              budgetMax: Number(row.budget_max),
              currency,
              deadline: row.deadline,
              creativeConstraints: row.creative_constraints,
              referenceLinks: row.reference_links,
              invitedCreatorId: row.invited_creator_id || undefined,
              status: row.status || 'published',
              savedRemotely: true,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            };
          });
        } else if (error) {
          console.warn('Supabase fetch failed, proceeding with local fallback:', error.message);
        }
      } catch (err) {
        console.warn('Supabase fetch failed, proceeding with local fallback:', err);
      }
    }

    return reconcileBriefRecords(remoteBriefs, localPublished);
  },

  /**
   * Retrieves a single published brief by ID with reconciliation between remote and local versions.
   */
  async getBriefById(id: string): Promise<BriefFormData | null> {
    let remoteBrief: BriefFormData | null = null;

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('campaign_briefs')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          const currency: 'INR' | 'USD' =
            data.currency || (isHistoricalUSDBrief(data.created_at) ? 'USD' : 'INR');
          remoteBrief = {
            id: data.id,
            userId: data.user_id || undefined,
            title: data.title,
            brandName: data.brand_name,
            objective: data.objective,
            targetAudience: data.target_audience,
            channels: data.channels || [],
            contentType: data.content_type,
            creativeStyle: data.creative_style,
            aspectRatio: data.aspect_ratio,
            duration: data.duration,
            deliverablesCount: data.deliverables_count,
            preferredTools: data.preferred_tools || [],
            requiredSkills: data.required_skills || [],
            commercialUsage: data.commercial_usage,
            usageTerritory: data.usage_territory,
            usageDuration: data.usage_duration,
            modelSafetyPolicy: data.model_safety_policy,
            budgetMin: Number(data.budget_min),
            budgetMax: Number(data.budget_max),
            currency,
            deadline: data.deadline,
            creativeConstraints: data.creative_constraints,
            referenceLinks: data.reference_links,
            invitedCreatorId: data.invited_creator_id || undefined,
            status: data.status || 'published',
            savedRemotely: true,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        console.warn('Supabase getBriefById failed, trying local store:', err);
      }
    }

    const localBrief = briefStorage.getBriefById(id);

    if (remoteBrief && localBrief) {
      const reconciled = reconcileBriefRecords([remoteBrief], [localBrief]);
      return reconciled[0] || remoteBrief;
    }

    if (remoteBrief) return remoteBrief;
    if (localBrief) return { ...localBrief, savedRemotely: false };
    return null;
  },
};
