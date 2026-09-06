/**
 * Unified date, time, and number formatting utilities.
 */

/**
 * Formats an ISO date or timestamp into a localized German date string.
 */
export function formatDate(
  dateInput: string | Date,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' },
  locale = 'de-CH'
): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString(locale, options);
}

/**
 * Formats a timestamp into a human-friendly relative label ("Heute", "Gestern", or full date).
 */
export function formatRelativeDate(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Heute';
  if (isYesterday) return 'Gestern';
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: 'short' });
}

/**
 * Formats a decimal score with fixed decimal places (e.g. 4.2).
 */
export function formatScore(score: number, digits = 1): string {
  if (isNaN(score) || score <= 0) return '–';
  return score.toFixed(digits);
}

/**
 * Calculates and rounds percentage (0 - 100).
 */
export function calcPercentage(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}
