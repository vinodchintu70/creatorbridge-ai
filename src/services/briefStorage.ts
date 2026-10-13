import { BriefFormData } from '@/types/brief';
import { isHistoricalUSDBrief } from '@/utils/formatCurrency';

const DRAFT_STORAGE_KEY = 'creatorbridge_brief_draft_v1';
const PUBLISHED_STORAGE_KEY = 'creatorbridge_published_briefs_v1';

/**
 * Client-side Storage Service for Milestone 2.
 * LIMITATION: Uses browser LocalStorage for demonstration persistence.
 * Data persists across page reloads on this machine, but is not synced to a remote database.
 */
export const briefStorage = {
  saveDraft(data: Partial<BriefFormData>): void {
    if (typeof window === 'undefined') return;
    try {
      const payload = {
        ...data,
        currency: data.currency || 'INR',
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('Failed to save brief draft to localStorage:', err);
    }
  },

  loadDraft(): Partial<BriefFormData> | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        currency: parsed.currency || 'INR',
      };
    } catch (err) {
      console.warn('Failed to load brief draft from localStorage:', err);
      return null;
    }
  },

  clearDraft(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear brief draft from localStorage:', err);
    }
  },

  publishBrief(data: BriefFormData): BriefFormData {
    if (typeof window === 'undefined') return data;
    try {
      const existing = this.getPublishedBriefs();
      const newBrief: BriefFormData = {
        ...data,
        currency: data.currency || 'INR',
        id: data.id || `brief-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        status: 'published',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [newBrief, ...existing];
      localStorage.setItem(PUBLISHED_STORAGE_KEY, JSON.stringify(updated));
      // Clear draft once published
      this.clearDraft();
      return newBrief;
    } catch (err) {
      console.warn('Failed to publish brief to localStorage:', err);
      return data;
    }
  },

  getPublishedBriefs(): BriefFormData[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(PUBLISHED_STORAGE_KEY);
      if (!stored) return [];
      const parsed: BriefFormData[] = JSON.parse(stored);
      return parsed.map((b) => ({
        ...b,
        currency: b.currency || (isHistoricalUSDBrief(b.createdAt) ? 'USD' : 'INR'),
      }));
    } catch (err) {
      console.warn('Failed to load published briefs from localStorage:', err);
      return [];
    }
  },

  getBriefById(id: string): BriefFormData | null {
    const briefs = this.getPublishedBriefs();
    return briefs.find((b) => b.id === id) || null;
  },
};
