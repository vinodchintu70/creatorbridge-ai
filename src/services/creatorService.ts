import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Creator } from '@/types/creator';
import { MOCK_CREATORS } from '@/data/mockCreators';
import { validateProvenanceIntegrity } from '@/utils/provenance';

/**
 * Unified Creator Data Access Service.
 * Acts as the single entry point for creator retrieval across the application,
 * ensuring zero-latency synchronous access to canonical creator catalog,
 * safe remote Supabase synchronization, and strict provenance integrity.
 */
export const creatorService = {
  /**
   * Synchronous accessor returning all available creators.
   * Guarantees immediate zero-latency access to the canonical creator catalog.
   */
  getAllCreators(): Creator[] {
    return MOCK_CREATORS;
  },

  /**
   * Synchronous lookup by creator ID.
   */
  getCreatorById(id: string): Creator | null {
    if (!id) return null;
    return MOCK_CREATORS.find((c) => c.id === id) || null;
  },

  /**
   * Asynchronous fetch that queries Supabase when configured,
   * merging any remote creator profiles with the local baseline catalog,
   * while strictly enforcing provenance integrity rules.
   */
  async getCreators(): Promise<Creator[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: creatorsData, error: creatorsError } = await supabase
          .from('creators')
          .select(`
            *,
            portfolio:portfolio_items(*)
          `);

        if (!creatorsError && creatorsData && creatorsData.length > 0) {
          const remoteCreators: Creator[] = creatorsData.map((row) => {
            // Provenance integrity: check if this creator is an established demo specimen
            const existingMock = MOCK_CREATORS.find((m) => m.id === row.id);
            const provenanceTier = existingMock
              ? existingMock.verification.provenanceTier
              : row.verification_status === 'verified' &&
                !validateProvenanceIntegrity({
                  status: row.verification_status,
                  provenanceTier: 'verified',
                  evidenceDetail: row.verification_details,
                }).isValid
              ? 'demo_evidence'
              : row.verification_status === 'verified'
              ? 'verified'
              : 'self_reported';

            return {
              id: row.id,
              userId: row.user_id || undefined,
              name: row.name,
              handle: row.handle,
              avatarUrl: row.avatar_url,
              bio: row.bio,
              location: row.location,
              specialization: row.specialization,
              rateEstimate: row.rate_estimate,
              availability: row.availability,
              skills: row.skills || [],
              primaryTools: row.primary_tools || [],
              commercialSuitability: row.commercial_suitability,
              verification: existingMock
                ? existingMock.verification
                : {
                    status: row.verification_status || 'unverified',
                    provenanceTier,
                    evidenceDetail: row.verification_details,
                    verifiedBadgeText:
                      provenanceTier === 'verified'
                        ? 'Verified Partner'
                        : provenanceTier === 'demo_evidence'
                        ? 'Demo Evidence'
                        : 'Self-Reported',
                    provenanceExplanation:
                      provenanceTier === 'verified'
                        ? 'Independently verified partner with supporting evidence.'
                        : provenanceTier === 'demo_evidence'
                        ? 'Simulated production pipeline, seeds, and node lineage created for demonstration purposes.'
                        : 'Creator-provided profile not independently verified.',
                  },
              portfolio:
                Array.isArray(row.portfolio) && row.portfolio.length > 0
                  ? row.portfolio.map((p: Record<string, unknown>) => ({
                      id: (p.id as string) || `proj-${Math.random().toString(36).substring(2, 7)}`,
                      title: (p.title as string) || 'Untitled Project',
                      description: (p.description as string) || '',
                      contentType: p.content_type || 'Video',
                      aspectRatio: p.aspect_ratio || '16:9 Landscape',
                      thumbnailUrl: (p.thumbnail_url as string) || row.avatar_url || '',
                      mediaType: p.media_type || 'video',
                      toolsUsed: Array.isArray(p.tools_used) ? p.tools_used : [],
                      clientOrContext: (p.client_or_context as string) || 'Independent Spec',
                      commercialLicense: p.commercial_license || 'Full IP Buyout',
                      workflow: {
                        primaryModel: (p.primary_model as string) || 'AI Model',
                        prompt: (p.prompt as string) || '',
                        negativePrompt: (p.negative_prompt as string) || '',
                        seed: Number(p.seed) || 0,
                        sampler: (p.sampler as string) || 'Euler A',
                        steps: Number(p.steps) || 30,
                        cfgScale: Number(p.cfg_scale) || 3.5,
                        pipelineNodes: Array.isArray(p.pipeline_nodes) ? p.pipeline_nodes : [],
                        consistencyNotes: (p.consistency_notes as string) || '',
                        productionTechnique: (p.production_technique as string) || 'Generative synthesis',
                      },
                    }))
                  : (existingMock?.portfolio || []),
            };
          });

          // Merge: start with MOCK_CREATORS map, update/append remote creators
          const creatorMap = new Map<string, Creator>();
          for (const c of MOCK_CREATORS) {
            creatorMap.set(c.id, c);
          }
          for (const rc of remoteCreators) {
            creatorMap.set(rc.id, rc);
          }
          return Array.from(creatorMap.values());
        }
      } catch (err) {
        console.warn('Supabase getCreators error, using mock dataset:', err);
      }
    }

    // Default demonstration dataset
    return MOCK_CREATORS;
  },

  async getCreatorByIdAsync(id: string): Promise<Creator | null> {
    const creators = await this.getCreators();
    return creators.find((c) => c.id === id) || null;
  },
};
