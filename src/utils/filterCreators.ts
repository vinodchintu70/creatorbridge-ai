import type { Creator, CreatorFilterState } from '@/types/creator';

export const INITIAL_FILTER_STATE: CreatorFilterState = {
  search: '',
  tools: [],
  specializations: [],
  contentTypes: [],
  aspectRatios: [],
  commercialLicense: 'all',
  verifiedOnly: false,
};

export function filterCreators(
  creators: Creator[],
  filters: CreatorFilterState
): Creator[] {
  return creators.filter((creator) => {
    // 1. Text Search: name, handle, bio, specialization, skills, or portfolio titles
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase().trim();
      const nameMatch = creator.name.toLowerCase().includes(query);
      const handleMatch = creator.handle.toLowerCase().includes(query);
      const bioMatch = creator.bio.toLowerCase().includes(query);
      const specMatch = creator.specialization.toLowerCase().includes(query);
      const skillsMatch = creator.skills.some((skill) =>
        skill.toLowerCase().includes(query)
      );
      const projectMatch = creator.portfolio.some(
        (proj) =>
          proj.title.toLowerCase().includes(query) ||
          proj.description.toLowerCase().includes(query) ||
          proj.toolsUsed.some((tool) => tool.toLowerCase().includes(query))
      );

      if (
        !nameMatch &&
        !handleMatch &&
        !bioMatch &&
        !specMatch &&
        !skillsMatch &&
        !projectMatch
      ) {
        return false;
      }
    }

    // 2. AI Tools and Models Filter
    if (filters.tools.length > 0) {
      const creatorTools = new Set<string>([
        ...creator.primaryTools,
        ...creator.portfolio.flatMap((p) => p.toolsUsed),
      ]);
      const hasMatchingTool = filters.tools.some((t) => creatorTools.has(t));
      if (!hasMatchingTool) return false;
    }

    // 3. Creator Specialization Filter
    if (filters.specializations.length > 0) {
      if (!filters.specializations.includes(creator.specialization)) {
        return false;
      }
    }

    // 4. Content Type Filter (Video, Animation, Still Image, 3D Asset)
    if (filters.contentTypes.length > 0) {
      const creatorContentTypes = new Set(
        creator.portfolio.map((p) => p.contentType)
      );
      const hasMatchingContentType = filters.contentTypes.some((ct) =>
        creatorContentTypes.has(ct)
      );
      if (!hasMatchingContentType) return false;
    }

    // 5. Aspect Ratio Filter (16:9, 9:16, 1:1, 2.39:1)
    if (filters.aspectRatios.length > 0) {
      const creatorAspectRatios = new Set(
        creator.portfolio.map((p) => p.aspectRatio)
      );
      const hasMatchingRatio = filters.aspectRatios.some((ar) =>
        creatorAspectRatios.has(ar)
      );
      if (!hasMatchingRatio) return false;
    }

    // 6. Commercial License Suitability
    if (filters.commercialLicense !== 'all') {
      const matchesCreatorSuitability =
        creator.commercialSuitability === filters.commercialLicense;
      const matchesAnyProject = creator.portfolio.some(
        (p) => p.commercialLicense === filters.commercialLicense
      );
      if (!matchesCreatorSuitability && !matchesAnyProject) {
        return false;
      }
    }

    // 7. Verification Status Filter
    if (filters.verifiedOnly && creator.verification.status !== 'verified') {
      return false;
    }

    return true;
  });
}

export function countActiveFilters(filters: CreatorFilterState): number {
  let count = 0;
  if (filters.search.trim()) count++;
  if (filters.tools.length > 0) count += filters.tools.length;
  if (filters.specializations.length > 0) count += filters.specializations.length;
  if (filters.contentTypes.length > 0) count += filters.contentTypes.length;
  if (filters.aspectRatios.length > 0) count += filters.aspectRatios.length;
  if (filters.commercialLicense !== 'all') count++;
  if (filters.verifiedOnly) count++;
  return count;
}
