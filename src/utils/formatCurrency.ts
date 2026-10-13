export type SupportedCurrency = 'INR' | 'USD';

/**
 * Historical boundary timestamp marking the transition from USD to INR in CreatorBridge AI.
 * Briefs created prior to this timestamp are historical USD briefs and must not be silently converted.
 */
export const INR_TRANSITION_TIMESTAMP = '2026-10-12T14:35:00.000Z';

/**
 * Determines whether a given timestamp belongs to the legacy USD era.
 */
export function isHistoricalUSDBrief(createdAt?: string | null): boolean {
  if (!createdAt) return false;
  try {
    const createdTime = new Date(createdAt).getTime();
    const transitionTime = new Date(INR_TRANSITION_TIMESTAMP).getTime();
    return createdTime < transitionTime;
  } catch {
    return false;
  }
}

/**
 * Formats a monetary amount into a clean currency string.
 * Supports Indian Rupees (₹ INR) with en-IN formatting (e.g. ₹1,00,000)
 * and backward-compatible US Dollars ($ USD) with en-US formatting (e.g. $3,000).
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: SupportedCurrency = 'INR',
  includeCode: boolean = true
): string {
  if (amount === undefined || amount === null || amount === '') {
    return '';
  }
  const num = Number(amount);
  if (isNaN(num)) return '';

  if (currency === 'USD') {
    return includeCode ? `$${num.toLocaleString('en-US')} USD` : `$${num.toLocaleString('en-US')}`;
  }

  return includeCode ? `₹${num.toLocaleString('en-IN')} INR` : `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Formats a budget range (min - max) respecting the currency of the brief.
 * Explicitly preserves legacy USD briefs ($3,000 – $6,500 USD) while
 * displaying modern briefs in Indian Rupees (₹1,00,000 – ₹2,50,000 INR).
 */
export function formatBudgetRange(
  min: number | string | null | undefined,
  max: number | string | null | undefined,
  currency: SupportedCurrency = 'INR'
): string {
  const hasMin = min !== undefined && min !== null && min !== '';
  const hasMax = max !== undefined && max !== null && max !== '';

  if (!hasMin && !hasMax) {
    return 'Unspecified Budget';
  }

  const minNum = hasMin ? Number(min) : null;
  const maxNum = hasMax ? Number(max) : null;

  if (currency === 'USD') {
    if (minNum !== null && maxNum !== null) {
      return `$${minNum.toLocaleString('en-US')} – $${maxNum.toLocaleString('en-US')} USD`;
    }
    if (minNum !== null) return `From $${minNum.toLocaleString('en-US')} USD`;
    if (maxNum !== null) return `Up to $${maxNum.toLocaleString('en-US')} USD`;
  }

  // Default: INR with Indian number formatting
  if (minNum !== null && maxNum !== null) {
    return `₹${minNum.toLocaleString('en-IN')} – ₹${maxNum.toLocaleString('en-IN')} INR`;
  }
  if (minNum !== null) return `From ₹${minNum.toLocaleString('en-IN')} INR`;
  if (maxNum !== null) return `Up to ₹${maxNum.toLocaleString('en-IN')} INR`;

  return 'Unspecified Budget';
}
