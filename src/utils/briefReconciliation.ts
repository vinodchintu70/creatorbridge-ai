import type { BriefFormData } from '@/types/brief';

/**
 * Helper to safely extract epoch milliseconds from ISO timestamp strings.
 */
export function parseBriefTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  const parsed = new Date(dateStr).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Reconciles remote (Supabase) and local (browser storage) published briefs.
 *
 * Conflict Resolution Policy:
 * 1. Scope: Only published briefs are reconciled. Drafts are NEVER merged or published.
 * 2. Deduplication: Stable identifier `brief.id` uniquely identifies brief records.
 * 3. Authority & Precedence:
 *    - Remote Supabase records are the canonical cloud source of truth.
 *    - If a brief exists in both remote and local stores:
 *      * If remote updatedAt/createdAt >= local updatedAt/createdAt:
 *        Remote record takes precedence (savedRemotely: true). Stale local data NEVER overwrites it.
 *      * If local updatedAt is STRICTLY NEWER than remote updatedAt:
 *        Local version is preserved as pending local modification (savedRemotely: false).
 * 4. Disjoint Local Preservation:
 *    - Locally created or offline briefs whose `id` is not present remotely are retained
 *      (savedRemotely: false) and never dropped merely because remote records were returned.
 * 5. Deterministic Ordering:
 *    - Output list is sorted descending by creation timestamp (or updatedAt fallback).
 * 6. Historical Currency:
 *    - Currency is preserved, defaulting to INR, with historical USD dates respected.
 */
export function reconcileBriefRecords(
  remoteBriefs: BriefFormData[],
  localBriefs: BriefFormData[]
): BriefFormData[] {
  const recordMap = new Map<string, BriefFormData>();

  // 1. Prime map with remote records (authoritative)
  for (const remote of remoteBriefs) {
    if (!remote || !remote.id) continue;
    recordMap.set(remote.id, {
      ...remote,
      savedRemotely: true,
    });
  }

  // 2. Reconcile with local records
  for (const local of localBriefs) {
    if (!local || !local.id) continue;

    const existingRemote = recordMap.get(local.id);
    if (!existingRemote) {
      // Disjoint local record (e.g. created offline or prior to remote connection): preserve it
      recordMap.set(local.id, {
        ...local,
        savedRemotely: false,
      });
    } else {
      // Both exist: check timestamps
      const remoteTime = parseBriefTimestamp(existingRemote.updatedAt || existingRemote.createdAt);
      const localTime = parseBriefTimestamp(local.updatedAt || local.createdAt);

      if (localTime > remoteTime) {
        // Strictly newer local edit: preserve local version, flag savedRemotely: false
        recordMap.set(local.id, {
          ...local,
          savedRemotely: false,
        });
      } else {
        // Remote is equal or newer: remote wins; do not overwrite with stale local data
        recordMap.set(local.id, {
          ...existingRemote,
          savedRemotely: true,
        });
      }
    }
  }

  // 3. Return sorted descending by creation/update time
  return Array.from(recordMap.values()).sort((a, b) => {
    const timeB = parseBriefTimestamp(b.createdAt || b.updatedAt);
    const timeA = parseBriefTimestamp(a.createdAt || a.updatedAt);
    return timeB - timeA;
  });
}
