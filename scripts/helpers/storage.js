import { PLANNER_STORAGE_KEY, PLANNER_STORAGE_VERSION } from '@helper/constants.js';
import { toISODate, parseISODate } from '@helper/date-utils.js';
import { createPeriod } from '@helper/period.js';

export function reportInvalidPlannerData(message, details) {
  console.error(message, details);
}

export function normalizeManualHolidayDates(values) {
  if (!Array.isArray(values)) {
    return null;
  }

  const normalized = values
    .map((dateValue) => {
      if (typeof dateValue !== 'string') {
        return null;
      }
      const parsed = parseISODate(dateValue);
      return parsed ? toISODate(parsed) : null;
    })
    .filter((dateValue) => !!dateValue);

  if (normalized.length !== values.length) {
    return null;
  }

  return normalized;
}

export function serializePlannerState(maxDays, periods = [], manualHolidays = new Set()) {
  const manualHolidayList = Array.from(manualHolidays).sort();

  return {
    version: PLANNER_STORAGE_VERSION,
    maxDays,
    manualHolidays: manualHolidayList,
    holidays: {
      manualHolidays: manualHolidayList,
    },
    periods: periods.map((period) => ({
      label: period.label,
      days: period.days,
      start: toISODate(period.start),
      end: toISODate(period.end),
      isUsed: period.isUsed,
    })),
  };
}

export function validatePlannerState(data, { onError } = {}) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    reportInvalidPlannerData('The planner JSON is not compatible or is incorrect.', data);
    onError?.('The planner JSON is not compatible or is incorrect.');
    return null;
  }

  const {
    maxDays,
    periods,
    version,
    manualHolidays,
    holidays,
  } = data;

  if (version !== PLANNER_STORAGE_VERSION) {
    reportInvalidPlannerData('The planner JSON version is not supported.', data);
    onError?.('The planner JSON version is not supported.');
    return null;
  }

  const validMaxDays = maxDays === null || Number.isInteger(maxDays);
  if (!validMaxDays || !Array.isArray(periods)) {
    reportInvalidPlannerData('The planner JSON is missing required fields.', data);
    onError?.('The planner JSON is missing required fields.');
    return null;
  }

  const topLevelManualHolidays = manualHolidays ?? [];
  const nestedManualHolidays = holidays?.manualHolidays ?? [];
  const normalizedTopLevel = normalizeManualHolidayDates(topLevelManualHolidays);
  const normalizedNested = normalizeManualHolidayDates(nestedManualHolidays);
  if (!normalizedTopLevel || !normalizedNested) {
    reportInvalidPlannerData('Manual holidays format is invalid.', manualHolidays);
    onError?.('Manual holidays format is invalid.');
    return null;
  }

  const manualHolidaySet = new Set([...normalizedTopLevel, ...normalizedNested]);

  let invalidMessage = '';
  let invalidDetails = null;
  const normalizedPeriods = periods.map((period) => {
    if (!period || typeof period !== 'object' || Array.isArray(period)) {
      invalidMessage = 'Each planner period must be an object.';
      invalidDetails = period;
      return null;
    }

    const {
      label,
      days,
      start,
      end,
      isUsed,
    } = period;

    const parsedStart = parseISODate(start);
    const parsedEnd = parseISODate(end);
    if (
      typeof label !== 'string'
      || !Number.isInteger(days)
      || typeof isUsed !== 'boolean'
      || !parsedStart
      || !parsedEnd
    ) {
      invalidMessage = 'One of the planner periods has an invalid format.';
      invalidDetails = period;
      return null;
    }

    const normalizedPeriod = createPeriod(parsedStart, parsedEnd, isUsed, manualHolidaySet);
    if (normalizedPeriod.label !== label || normalizedPeriod.days !== days) {
      invalidMessage = 'One of the planner periods does not match the expected date range format.';
      invalidDetails = period;
      return null;
    }

    return normalizedPeriod;
  });

  if (invalidMessage || normalizedPeriods.some((period) => period === null)) {
    reportInvalidPlannerData(invalidMessage, invalidDetails);
    onError?.(invalidMessage);
    return null;
  }

  return {
    maxDays,
    manualHolidays: manualHolidaySet,
    periods: normalizedPeriods,
  };
}

export function loadPlannerState() {
  const storedValue = window.localStorage.getItem(PLANNER_STORAGE_KEY);
  if (!storedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedValue);
    return validatePlannerState(parsed);
  } catch (error) {
    reportInvalidPlannerData('The saved planner JSON could not be parsed.', error);
    return null;
  }
}

export function savePlannerState(maxDays, periods = [], manualHolidays = new Set()) {
  const serialized = serializePlannerState(maxDays, periods, manualHolidays);
  window.localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(serialized, null, 2));
}

export function clearSavedPlannerState() {
  window.localStorage.removeItem(PLANNER_STORAGE_KEY);
}

export function downloadPlannerState(maxDays, periods = [], manualHolidays = new Set()) {
  const serialized = serializePlannerState(maxDays, periods, manualHolidays);
  const blob = new Blob([JSON.stringify(serialized, null, 2)], {
    type: 'application/json',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'holiday-planner-data.json';
  document.body.append(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
