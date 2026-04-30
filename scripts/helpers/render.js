import { DAY_ABBR } from '@helper/constants.js';
import {
  formatAriaDate,
  formatRangeDisplay,
  isBankHoliday,
  toISODate,
} from '@helper/date-utils.js';
import { getSummaryDays } from '@helper/period.js';
import { getPeriodsTableRowsTemplate } from '@helper/templates.js';

export function renderTableBody(tbody, maxDays, periods = []) {
  const summary = getSummaryDays(periods, maxDays);
  const html = `<tr>
    <td data-label="Used days">${summary.usedDays}</td>
    <td data-label="Planned/Upcoming days">${summary.plannedUpcomingDays}</td>
    <td data-label="Unplanned days">${summary.unplannedDays}</td>
    <td data-label="Days left">${summary.remainingDays}</td>
    <td data-label="Total days">${summary.totalDays}</td>
  </tr>`;
  tbody.innerHTML = html;
}

export function renderPeriodsTable(tbody, periods = []) {
  tbody.innerHTML = getPeriodsTableRowsTemplate(periods, {
    formatRangeLabel: formatRangeDisplay,
  });
}

export function renderCalGrid(
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

    const ariaCurrent = iso === today ? ' aria-current="date"' : '';
    cells += `<button type="button" class="${classes.join(' ')}" data-date="${iso}" aria-label="${formatAriaDate(date)}"${ariaCurrent}>${d}</button>`;
  }

  grid.innerHTML = heads + empties + cells;
}
