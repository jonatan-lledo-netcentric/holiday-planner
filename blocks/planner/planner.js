import { createElement } from '../../scripts/common.js';

const PLANNER_STORAGE_KEY = 'holiday-planner-data';
const PLANNER_STORAGE_VERSION = 1;

function getMaxDays(value) {
  const trimmed = value.trim();
  const days = Number(trimmed);

  if (!trimmed || !Number.isInteger(days) || days < 0) {
    return null;
  }

  return days;
}

function reportInvalidPlannerData(message, details) {
  console.error(message, details);
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getOrdinalSuffix(day) {
  if (day >= 11 && day <= 13) return 'th';
  const remainder = day % 10;
  if (remainder === 1) return 'st';
  if (remainder === 2) return 'nd';
  if (remainder === 3) return 'rd';
  return 'th';
}

function formatDisplayDate(date) {
  const month = MONTH_NAMES[date.getMonth()].slice(0, 3);
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}${getOrdinalSuffix(day)} of ${year}`;
}

function formatRangeDisplay(label) {
  const parts = label.split(' \u2013 ');
  if (parts.length !== 2) return label;
  const [startISO, endISO] = parts;
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return label;
  return `${formatDisplayDate(start)} \u2013 ${formatDisplayDate(end)}`;
}

function renderPeriodsTable(tbody, periods = []) {
  let html = '';
  if (periods.length === 0) {
    html = '<tr><td colspan="4" style="text-align: center; color: #6b7280;">No periods added yet.</td></tr>';
  } else {
    periods.forEach((period, index) => {
      const checked = period.isUsed ? 'checked' : '';
      const displayLabel = formatRangeDisplay(period.label);
      html += `<tr>
        <td>${displayLabel}</td>
        <td>${period.days}</td>
        <td>
          <input
            type="checkbox"
            class="planner-period-used"
            data-index="${index}"
            aria-label="Mark ${displayLabel} as used"
            ${checked}
          >
        </td>
        <td>
          <button
            type="button"
            class="planner-period-delete"
            data-index="${index}"
            aria-label="Delete ${displayLabel}"
          >
            Delete
          </button>
        </td>
      </tr>`;
    });
  }
  tbody.innerHTML = html;
}

function setFeedback(feedback, message, isError = false) {
  feedback.textContent = message;
  feedback.classList.toggle('is-error', isError);
}

// ─── Calendar helpers ────────────────────────────────────────────────────────

const DAY_ABBR = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// Spain/Barcelona bank holidays (month-day format)
const BANK_HOLIDAYS = [
  '01-01', // New Year's Day
  '01-06', // Epiphany
  '04-23', // St. George's Day (Catalonia)
  '05-01', // Labour Day
  '08-15', // Assumption of Mary
  '09-11', // National Day of Catalonia
  '10-12', // Spanish National Day
  '11-01', // All Saints' Day
  '12-06', // Constitution Day
  '12-25', // Christmas Day
];

function isBankHoliday(date, manualHolidays = new Set()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const iso = `${y}-${m}-${d}`;
  if (manualHolidays.has(iso)) {
    return true;
  }

  return BANK_HOLIDAYS.includes(`${m}-${d}`);
}

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isWorkingDay(date, manualHolidays = new Set()) {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  return !isWeekend && !isBankHoliday(date, manualHolidays);
}

function getSummaryDays(periods = [], maxDays = null) {
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

function renderTableBody(tbody, maxDays, periods = []) {
  const summary = getSummaryDays(periods, maxDays);
  const html = `<tr>
    <td>${summary.usedDays}</td>
    <td>${summary.plannedUpcomingDays}</td>
    <td>${summary.unplannedDays}</td>
    <td>${summary.remainingDays}</td>
    <td>${summary.totalDays}</td>
  </tr>`;
  tbody.innerHTML = html;
}

function parseISODate(str) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((str || '').trim());
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseTextRange(value) {
  const dates = (value || '').match(/\d{4}-\d{2}-\d{2}/g);
  if (!dates || dates.length !== 2) return null;
  const start = parseISODate(dates[0]);
  const end = parseISODate(dates[1]);
  if (!start || !end) return null;
  return start <= end ? [start, end] : [end, start];
}

function calcDaysBetween(start, end, manualHolidays = new Set()) {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    if (isWorkingDay(current, manualHolidays)) {
      count += 1;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function formatRange(start, end) {
  return `${toISODate(start)} \u2013 ${toISODate(end)}`;
}

function createPeriod(start, end, isUsed = false, manualHolidays = new Set()) {
  return {
    label: formatRange(start, end),
    days: calcDaysBetween(start, end, manualHolidays),
    start,
    end,
    isUsed,
  };
}

function serializePlannerState(maxDays, periods = [], manualHolidays = new Set()) {
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

function normalizeManualHolidayDates(values) {
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

function validatePlannerState(data, { onError } = {}) {
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

function loadPlannerState() {
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

function savePlannerState(maxDays, periods = [], manualHolidays = new Set()) {
  const serialized = serializePlannerState(maxDays, periods, manualHolidays);
  window.localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(serialized, null, 2));
}

function clearSavedPlannerState() {
  window.localStorage.removeItem(PLANNER_STORAGE_KEY);
}

function downloadPlannerState(maxDays, periods = [], manualHolidays = new Set()) {
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

function renderCalGrid(
  grid,
  viewYear,
  viewMonth,
  rangeStart,
  rangeEnd,
  previewDate,
  manualHolidays = new Set(),
) {
  const today = toISODate(new Date());
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();

  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const startIso = rangeStart ? toISODate(rangeStart) : null;
  const rawEnd = rangeEnd || previewDate;
  const endIso = rawEnd ? toISODate(rawEnd) : null;
  const isPreviewActive = !!previewDate && !rangeEnd;

  let lo;
  let hi;
  if (startIso && endIso) {
    lo = startIso <= endIso ? startIso : endIso;
    hi = startIso <= endIso ? endIso : startIso;
  } else {
    lo = startIso;
    hi = null;
  }

  const heads = DAY_ABBR.map((abbr) => `<span class="planner-cal-head">${abbr}</span>`).join('');
  const empties = '<span class="planner-cal-empty" aria-hidden="true"></span>'.repeat(startDow);

  let cells = '';
  for (let d = 1; d <= lastDate; d += 1) {
    const iso = toISODate(new Date(viewYear, viewMonth, d));
    const date = new Date(viewYear, viewMonth, d);
    const isStart = iso === lo;
    const isEnd = hi !== null && iso === hi;
    const inRange = lo !== null && hi !== null && iso > lo && iso < hi;
    const isBankHol = isBankHoliday(date, manualHolidays);
    const isManualHoliday = manualHolidays.has(iso);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    const classes = ['planner-cal-day'];
    if (isStart) classes.push('is-start');
    if (isEnd) classes.push('is-end');
    if (inRange) classes.push(isPreviewActive ? 'is-preview' : 'in-range');
    if (iso === today) classes.push('is-today');
    if (isBankHol) classes.push('is-bank-holiday');
    if (isManualHoliday) classes.push('is-manual-holiday');
    if (isWeekend) classes.push('is-weekend');

    cells += `<button type="button" class="${classes.join(' ')}" data-date="${iso}" aria-label="${iso}">${d}</button>`;
  }

  grid.innerHTML = heads + empties + cells;
}

function initPeriodPicker(container, { getManualHolidays, onManualHolidaysChange } = {}) {
  const textInput = container.querySelector('.planner-period-text');
  const calendar = container.querySelector('.planner-calendar');
  const calLabel = container.querySelector('.planner-cal-label');
  const calGrid = container.querySelector('.planner-cal-grid');
  const prevBtn = container.querySelector('.planner-cal-prev');
  const nextBtn = container.querySelector('.planner-cal-next');
  const manualModeInput = container.querySelector('.planner-manual-mode-input');

  if (
    !textInput
    || !calendar
    || !calLabel
    || !calGrid
    || !prevBtn
    || !nextBtn
    || !manualModeInput
  ) {
    return null;
  }

  const now = new Date();
  let viewYear = now.getFullYear();
  let viewMonth = now.getMonth();
  let rangeStart = null;
  let rangeEnd = null;
  let previewDate = null;
  let selecting = 'start';
  let isManualMode = manualModeInput.checked;

  function currentManualHolidays() {
    if (typeof getManualHolidays === 'function') {
      return getManualHolidays();
    }

    return new Set();
  }

  function updateTextInput() {
    if (rangeStart && rangeEnd) {
      textInput.value = formatRange(rangeStart, rangeEnd);
    } else if (rangeStart) {
      textInput.value = toISODate(rangeStart);
    } else {
      textInput.value = '';
    }
  }

  function render() {
    calLabel.textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
    renderCalGrid(
      calGrid,
      viewYear,
      viewMonth,
      rangeStart,
      rangeEnd,
      previewDate,
      currentManualHolidays(),
    );
  }

  function resetSelection() {
    rangeStart = null;
    rangeEnd = null;
    previewDate = null;
    selecting = 'start';
    textInput.value = '';
    render();
  }

  function applyPreview(hoverIso) {
    const startIso = rangeStart ? toISODate(rangeStart) : null;
    calGrid.querySelectorAll('[data-date]').forEach((cell) => {
      const iso = cell.dataset.date;
      cell.classList.remove('is-preview', 'is-end');
      if (!hoverIso || !startIso) return;
      const lo = startIso <= hoverIso ? startIso : hoverIso;
      const hi = startIso <= hoverIso ? hoverIso : startIso;
      if (iso === hoverIso) cell.classList.add('is-end');
      if (iso > lo && iso < hi) cell.classList.add('is-preview');
    });
  }

  prevBtn.addEventListener('click', () => {
    if (viewMonth === 0) {
      viewYear -= 1;
      viewMonth = 11;
    } else {
      viewMonth -= 1;
    }
    render();
  });

  nextBtn.addEventListener('click', () => {
    if (viewMonth === 11) {
      viewYear += 1;
      viewMonth = 0;
    } else {
      viewMonth += 1;
    }
    render();
  });

  calGrid.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-date]');
    if (!btn) return;
    const date = parseISODate(btn.dataset.date);
    if (!date) return;

    if (isManualMode) {
      const iso = toISODate(date);
      const nextManualHolidays = new Set(currentManualHolidays());
      if (nextManualHolidays.has(iso)) {
        nextManualHolidays.delete(iso);
      } else {
        nextManualHolidays.add(iso);
      }

      if (typeof onManualHolidaysChange === 'function') {
        onManualHolidaysChange(nextManualHolidays);
      }
      render();
      return;
    }

    if (selecting === 'start') {
      rangeStart = date;
      rangeEnd = null;
      previewDate = null;
      selecting = 'end';
    } else {
      rangeEnd = date;
      if (rangeStart > rangeEnd) [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
      previewDate = null;
      selecting = 'start';
    }
    updateTextInput();
    render();
  });

  calGrid.addEventListener('mouseover', (event) => {
    if (isManualMode) return;
    if (selecting !== 'end') return;
    const btn = event.target.closest('[data-date]');
    const hoverIso = btn ? btn.dataset.date : null;
    previewDate = btn ? parseISODate(hoverIso) : null;
    applyPreview(hoverIso);
  });

  calGrid.addEventListener('mouseleave', () => {
    if (isManualMode) return;
    if (selecting !== 'end') return;
    previewDate = null;
    applyPreview(null);
  });

  textInput.addEventListener('change', () => {
    const textValue = textInput.value.trim();
    if (!textValue) {
      resetSelection();
      return;
    }

    const parsed = parseTextRange(textValue);
    if (!parsed) return;
    [rangeStart, rangeEnd] = parsed;
    viewYear = rangeStart.getFullYear();
    viewMonth = rangeStart.getMonth();
    selecting = 'start';
    render();
  });

  manualModeInput.addEventListener('change', () => {
    isManualMode = manualModeInput.checked;
    selecting = 'start';
    previewDate = null;
    render();
  });

  document.addEventListener('click', (event) => {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const clickedInsideCalendar = path.length > 0
      ? path.includes(calendar)
      : calendar.contains(event.target);

    if (clickedInsideCalendar) return;

    if (selecting === 'end') {
      // Keep manual input untouched when clicking outside while ending a range.
      selecting = 'start';
      previewDate = null;
      render();
    }
  });

  render();

  return {
    render,
  };
}

export default function decorate(block) {
  let maxDays = null;
  let periods = [];
  let manualHolidays = new Set();
  let periodPickerApi = null;

  const wrapper = createElement('div', {
    className: 'planner-wrapper',
    innerContent: `
      <form class="planner-form">
        <label for="planner-max-days">Max holiday days for the year</label>
        <input
          id="planner-max-days"
          name="planner-max-days"
          type="text"
          inputmode="numeric"
          placeholder="e.g. 25"
          aria-describedby="planner-feedback"
        >
        <button type="submit">Add max days</button>
        <p class="planner-feedback" id="planner-feedback" aria-live="polite"></p>
      </form>
      <table class="planner-table">
        <thead>
          <tr>
            <th scope="col">Used days</th>
            <th scope="col">Planned/Upcoming days</th>
            <th scope="col">Unplanned days</th>
            <th scope="col">Days left</th>
            <th scope="col">Total days</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <table class="planner-periods-table">
        <thead>
          <tr>
            <th scope="col">Date range</th>
            <th scope="col">Days</th>
            <th scope="col">Used</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <div class="planner-actions">
        <div class="planner-actions-menu-wrap">
          <button
            class="planner-actions-toggle"
            type="button"
            aria-haspopup="menu"
            aria-expanded="false"
            aria-controls="planner-actions-menu"
            aria-label="Open saved data actions"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div class="planner-actions-menu" id="planner-actions-menu" role="menu" hidden>
            <button class="planner-save" type="button" role="menuitem">Save</button>
            <button class="planner-export" type="button" role="menuitem">Export JSON</button>
            <button class="planner-import" type="button" role="menuitem">Import JSON</button>
            <button class="planner-clear-saved" type="button" role="menuitem">Clear saved data</button>
          </div>
        </div>
        <button class="planner-clear" type="button">Clear all</button>
        <input
          type="file"
          class="planner-import-input"
          accept="application/json,.json"
          hidden
        >
      </div>
      <div class="planner-popup" hidden>
        <div class="planner-popup-content" role="alertdialog" aria-modal="true" aria-labelledby="planner-popup-title">
          <h3 class="planner-popup-title" id="planner-popup-title">Import error</h3>
          <p class="planner-popup-message"></p>
          <button class="planner-popup-close" type="button">Close</button>
        </div>
      </div>
      <section class="planner-period">
        <h3 class="planner-period-title">Add holiday period</h3>
        <label for="planner-period-text">Date range</label>
        <div class="planner-period-controls">
          <input
            type="text"
            id="planner-period-text"
            class="planner-period-text"
            placeholder="YYYY-MM-DD \u2013 YYYY-MM-DD"
            autocomplete="off"
          >
          <button type="button" class="planner-add-period">Add period</button>
        </div>
        <label class="planner-manual-mode" for="planner-manual-mode">
          <input type="checkbox" id="planner-manual-mode" class="planner-manual-mode-input">
          Manual holidays mode
        </label>
        <div class="planner-calendar">
          <div class="planner-calendar-nav">
            <button type="button" class="planner-cal-prev" aria-label="Previous month">&#8249;</button>
            <span class="planner-cal-label"></span>
            <button type="button" class="planner-cal-next" aria-label="Next month">&#8250;</button>
          </div>
          <div class="planner-cal-grid" role="grid" aria-label="Date range picker"></div>
        </div>
      </section>
    `,
  });

  const form = wrapper.querySelector('.planner-form');
  const input = wrapper.querySelector('#planner-max-days');
  const feedback = wrapper.querySelector('#planner-feedback');
  const tbody = wrapper.querySelector('.planner-table tbody');
  const periodsTbody = wrapper.querySelector('.planner-periods-table tbody');
  const popup = wrapper.querySelector('.planner-popup');
  const popupMessage = wrapper.querySelector('.planner-popup-message');
  const popupCloseButton = wrapper.querySelector('.planner-popup-close');
  const actionsMenuWrap = wrapper.querySelector('.planner-actions-menu-wrap');
  const actionsToggle = wrapper.querySelector('.planner-actions-toggle');
  const actionsMenu = wrapper.querySelector('.planner-actions-menu');
  const saveButton = wrapper.querySelector('.planner-save');
  const exportButton = wrapper.querySelector('.planner-export');
  const importButton = wrapper.querySelector('.planner-import');
  const clearSavedButton = wrapper.querySelector('.planner-clear-saved');
  const clearButton = wrapper.querySelector('.planner-clear');
  const importInput = wrapper.querySelector('.planner-import-input');
  const periodContainer = wrapper.querySelector('.planner-period');
  const periodTextInput = wrapper.querySelector('.planner-period-text');
  const addPeriodButton = wrapper.querySelector('.planner-add-period');

  if (
    !form
    || !input
    || !feedback
    || !tbody
    || !periodsTbody
    || !popup
    || !popupMessage
    || !popupCloseButton
    || !actionsMenuWrap
    || !actionsToggle
    || !actionsMenu
    || !saveButton
    || !exportButton
    || !importButton
    || !clearSavedButton
    || !clearButton
    || !importInput
  ) {
    block.replaceChildren(wrapper);
    return;
  }

  function closePopup() {
    popup.hidden = true;
    popupMessage.textContent = '';
  }

  function openPopup(message) {
    popupMessage.textContent = message;
    popup.hidden = false;
  }

  function closeActionsMenu() {
    actionsMenu.hidden = true;
    actionsToggle.setAttribute('aria-expanded', 'false');
  }

  function openActionsMenu() {
    actionsMenu.hidden = false;
    actionsToggle.setAttribute('aria-expanded', 'true');
  }

  function toggleActionsMenu() {
    if (actionsMenu.hidden) {
      openActionsMenu();
      return;
    }

    closeActionsMenu();
  }

  function syncInputs() {
    input.value = maxDays === null ? '' : String(maxDays);
  }

  function updateTable() {
    renderTableBody(tbody, maxDays, periods);
    renderPeriodsTable(periodsTbody, periods);
  }

  function recalculatePeriods() {
    periods = periods.map((period) => createPeriod(
      period.start,
      period.end,
      period.isUsed,
      manualHolidays,
    ));
    updateTable();
  }

  function applyPlannerState(nextMaxDays, nextPeriods, nextManualHolidays = new Set()) {
    maxDays = nextMaxDays;
    periods = nextPeriods;
    manualHolidays = new Set(nextManualHolidays);
    syncInputs();
    updateTable();
    periodPickerApi?.render();
  }

  input.addEventListener('input', () => {
    if (!input.value.trim() && feedback.classList.contains('is-error')) {
      setFeedback(feedback, '');
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const parsed = getMaxDays(input.value);
    if (parsed === null) {
      setFeedback(feedback, 'Please enter a valid non-negative whole number.', true);
      return;
    }

    maxDays = parsed;
    updateTable();
    setFeedback(feedback, 'Total holiday days updated.');
  });

  if (addPeriodButton) {
    addPeriodButton.addEventListener('click', () => {
      const textValue = periodTextInput?.value || '';
      const parsed = parseTextRange(textValue);
      if (!parsed) {
        setFeedback(feedback, 'Please select a valid date range in the calendar first.', true);
        return;
      }

      const [start, end] = parsed;
      const period = createPeriod(start, end, false, manualHolidays);

      periods.push(period);
      if (periodTextInput) {
        periodTextInput.value = '';
        periodTextInput.dispatchEvent(new Event('change'));
      }
      updateTable();
      setFeedback(feedback, `Added ${period.days}-day period to planned days.`);
    });
  }

  saveButton.addEventListener('click', () => {
    savePlannerState(maxDays, periods, manualHolidays);
    setFeedback(feedback, 'Planner data saved to local storage.');
    closeActionsMenu();
  });

  exportButton.addEventListener('click', () => {
    downloadPlannerState(maxDays, periods, manualHolidays);
    setFeedback(feedback, 'Planner data exported as JSON.');
    closeActionsMenu();
  });

  importButton.addEventListener('click', () => {
    importInput.click();
    closeActionsMenu();
  });

  clearSavedButton.addEventListener('click', () => {
    clearSavedPlannerState();
    setFeedback(feedback, 'Saved planner data removed from local storage.');
    closeActionsMenu();
  });

  actionsToggle.addEventListener('click', toggleActionsMenu);

  wrapper.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !actionsMenu.hidden) {
      closeActionsMenu();
      actionsToggle.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (actionsMenu.hidden) return;

    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const clickedInsideActions = path.length > 0
      ? path.includes(actionsMenuWrap)
      : actionsMenuWrap.contains(event.target);

    if (!clickedInsideActions) {
      closeActionsMenu();
    }
  });

  popupCloseButton.addEventListener('click', closePopup);

  popup.addEventListener('click', (event) => {
    if (event.target === popup) {
      closePopup();
    }
  });

  importInput.addEventListener('change', async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validatedState = validatePlannerState(parsed, { onError: openPopup });
      if (!validatedState) {
        return;
      }

      closePopup();
      applyPlannerState(
        validatedState.maxDays,
        validatedState.periods,
        validatedState.manualHolidays,
      );
      savePlannerState(
        validatedState.maxDays,
        validatedState.periods,
        validatedState.manualHolidays,
      );
      setFeedback(feedback, 'Planner data imported from JSON.');
    } catch (error) {
      reportInvalidPlannerData('The planner JSON is not compatible or is incorrect.', error);
      openPopup('The planner JSON is not compatible or is incorrect.');
    } finally {
      importInput.value = '';
    }
  });

  periodsTbody.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.planner-period-used');
    if (!checkbox) return;

    const index = Number(checkbox.dataset.index);
    if (!Number.isInteger(index) || !periods[index]) return;

    periods[index].isUsed = checkbox.checked;
    updateTable();
    const message = checkbox.checked
      ? 'Period moved to used days.'
      : 'Period moved back to planned days.';
    setFeedback(feedback, message);
  });

  periodsTbody.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('.planner-period-delete');
    if (!deleteButton) return;

    const index = Number(deleteButton.dataset.index);
    if (!Number.isInteger(index) || !periods[index]) return;

    periods.splice(index, 1);
    updateTable();
    setFeedback(feedback, 'Period deleted.');
  });

  clearButton.addEventListener('click', () => {
    maxDays = null;
    periods = [];
    manualHolidays = new Set();
    syncInputs();
    if (periodTextInput) {
      periodTextInput.value = '';
      periodTextInput.dispatchEvent(new Event('change'));
    }
    setFeedback(feedback, 'Data cleared.');
    updateTable();
    periodPickerApi?.render();
  });

  const savedState = loadPlannerState();
  if (savedState) {
    applyPlannerState(savedState.maxDays, savedState.periods, savedState.manualHolidays);
    setFeedback(feedback, 'Loaded saved planner data from local storage.');
  } else {
    updateTable();
  }

  if (periodContainer) {
    periodPickerApi = initPeriodPicker(periodContainer, {
      getManualHolidays: () => manualHolidays,
      onManualHolidaysChange: (nextManualHolidays) => {
        manualHolidays = new Set(nextManualHolidays);
        recalculatePeriods();
      },
    });
  }
  block.replaceChildren(wrapper);
}
