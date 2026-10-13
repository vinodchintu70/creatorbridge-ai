import type { BriefFormData, BriefValidationErrors } from '@/types/brief';

export interface ValidationResult {
  isValid: boolean;
  errors: BriefValidationErrors;
}

export function validateBrief(data: Partial<BriefFormData>): ValidationResult {
  const errors: BriefValidationErrors = {};

  // 1. Campaign & Brand Identity
  if (!data.title || data.title.trim().length < 5) {
    errors.title = 'Campaign title is required (at least 5 characters).';
  }

  if (!data.brandName || data.brandName.trim().length < 2) {
    errors.brandName = 'Brand or agency name is required.';
  }

  if (!data.objective || data.objective.trim().length < 15) {
    errors.objective = 'Please describe the campaign objective (at least 15 characters).';
  }

  if (!data.targetAudience || data.targetAudience.trim().length < 3) {
    errors.targetAudience = 'Target audience description is required.';
  }

  if (!data.channels || data.channels.length === 0) {
    errors.channels = 'Select at least one primary distribution channel.';
  }

  // 2. Creative & Format
  if (!data.creativeStyle || data.creativeStyle.trim().length < 10) {
    errors.creativeStyle = 'Creative style & visual direction is required (at least 10 characters).';
  }

  if (!data.aspectRatio || !data.aspectRatio.trim()) {
    errors.aspectRatio = 'Output aspect ratio and format are required.';
  }

  if (!data.deliverablesCount || Number(data.deliverablesCount) < 1) {
    errors.deliverablesCount = 'Deliverables count must be at least 1.';
  }

  // 3. Commercial Rights & Usage
  if (!data.commercialUsage || !data.commercialUsage.trim()) {
    errors.commercialUsage = 'Commercial rights license must be selected.';
  }

  if (!data.usageTerritory || !data.usageTerritory.trim()) {
    errors.usageTerritory = 'Intended usage territory is required (e.g. Worldwide, Regional).';
  }

  if (!data.usageDuration || !data.usageDuration.trim()) {
    errors.usageDuration = 'Intended usage duration is required (e.g. In Perpetuity, 1 Year).';
  }

  // 4. Budget & Schedule
  const currencyLabel = data.currency === 'USD' ? 'USD' : 'INR';
  if (data.budgetMin === undefined || data.budgetMin === null || (data.budgetMin as unknown) === '') {
    errors.budgetMin = `Minimum budget (${currencyLabel}) must be specified.`;
  } else {
    const min = Number(data.budgetMin);
    if (isNaN(min) || min < 0) {
      errors.budgetMin = `Minimum budget must be a positive amount in ${currencyLabel} or zero.`;
    }
  }

  if (data.budgetMax === undefined || data.budgetMax === null || (data.budgetMax as unknown) === '') {
    errors.budgetMax = `Maximum budget (${currencyLabel}) must be specified.`;
  } else {
    const max = Number(data.budgetMax);
    const min = Number(data.budgetMin);
    if (isNaN(max) || max <= 0) {
      errors.budgetMax = `Maximum budget must be greater than zero in ${currencyLabel}.`;
    } else if (!isNaN(min) && max < min) {
      errors.budgetMax = 'Maximum budget cannot be less than minimum budget.';
    }
  }

  if (!data.deadline || !data.deadline.trim()) {
    errors.deadline = 'Campaign delivery deadline date is required.';
  } else {
    const deadlineDate = new Date(data.deadline);
    if (isNaN(deadlineDate.getTime())) {
      errors.deadline = 'Please enter a valid deadline date.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
