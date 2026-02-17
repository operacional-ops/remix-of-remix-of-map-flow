import { startOfDay, subDays, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from 'date-fns';

/**
 * Returns a { start, end } date range based on a UTMify-style date preset.
 */
export function getDateRangeFromPreset(preset: string): { start: Date; end: Date } | null {
  const now = new Date();
  const today = startOfDay(now);

  switch (preset) {
    case 'today':
      return { start: today, end: now };
    case 'yesterday': {
      const y = subDays(today, 1);
      return { start: y, end: today };
    }
    case 'last_7d':
      return { start: subDays(today, 7), end: now };
    case 'last_14d':
      return { start: subDays(today, 14), end: now };
    case 'last_28d':
      return { start: subDays(today, 28), end: now };
    case 'last_30d':
      return { start: subDays(today, 30), end: now };
    case 'this_month':
      return { start: startOfMonth(today), end: now };
    case 'last_month': {
      const lastMonth = subMonths(today, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    }
    case 'last_90d':
      return { start: subDays(today, 90), end: now };
    case 'maximum':
    default:
      return null; // no filtering = show all
  }
}

/**
 * Filter an array of objects that have a `date_start` field (YYYY-MM-DD)
 * to only include rows within the given date preset range.
 */
export function filterByDatePreset<T extends { date_start?: string }>(
  items: T[] | undefined | null,
  preset: string
): T[] {
  if (!items) return [];
  const range = getDateRangeFromPreset(preset);
  if (!range) return items; // "maximum" → return all

  return items.filter(item => {
    if (!item.date_start) return false;
    try {
      const d = parseISO(item.date_start);
      return isWithinInterval(d, { start: range.start, end: range.end });
    } catch {
      return false;
    }
  });
}
