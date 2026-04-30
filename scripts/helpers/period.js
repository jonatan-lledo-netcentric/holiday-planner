import { calcDaysBetween, formatRange } from '@helper/date-utils.js';

export function getMaxDays(value) {
  const trimmed = value.trim();
  const days = Number(trimmed);

  if (!trimmed || !Number.isInteger(days) || days < 0) {
    return null;
  }

  return days;
}

export function getSummaryDays(periods = [], maxDays = null) {
  const usedDays = periods.reduce(
    (sum, period) => (period.isUsed ? sum + period.days : sum),
    0,
  );
  const plannedUpcomingDays = periods.reduce(
    (sum, period) => (!period.isUsed ? sum + period.days : sum),
    0,
  );
  const totalDays = Number.isInteger(maxDays) ? maxDays : usedDays + plannedUpcomingDays;
  const unplannedDays = Math.max(totalDays - usedDays - plannedUpcomingDays, 0);
  const remainingDays = Math.max(totalDays - usedDays, 0);

  return {
    usedDays,
    plannedUpcomingDays,
    unplannedDays,
    remainingDays,
    totalDays,
  };
}

export function createPeriod(start, end, isUsed = false, manualHolidays = new Set()) {
  return {
    label: formatRange(start, end),
    days: calcDaysBetween(start, end, manualHolidays),
    start,
    end,
    isUsed,
  };
}
