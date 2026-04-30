import { BANK_HOLIDAYS, MONTH_NAMES } from '@helper/constants.js';

export function getOrdinalSuffix(day) {
  if (day >= 11 && day <= 13) return 'th';
  const remainder = day % 10;
  if (remainder === 1) return 'st';
  if (remainder === 2) return 'nd';
  if (remainder === 3) return 'rd';
  return 'th';
}

export function formatDisplayDate(date) {
  const month = MONTH_NAMES[date.getMonth()].slice(0, 3);
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}${getOrdinalSuffix(day)} of ${year}`;
}

export function formatRangeDisplay(label) {
  const parts = label.split(' \u2013 ');
  if (parts.length !== 2) return label;
  const [startISO, endISO] = parts;
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return label;
  return `${formatDisplayDate(start)} \u2013 ${formatDisplayDate(end)}`;
}

export function formatAriaDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(str) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((str || '').trim());
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isBankHoliday(date, manualHolidays = new Set()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const iso = `${y}-${m}-${d}`;
  if (manualHolidays.has(iso)) {
    return true;
  }

  return BANK_HOLIDAYS.includes(`${m}-${d}`);
}

export function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

export function isWorkingDay(date, manualHolidays = new Set()) {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  return !isWeekend && !isBankHoliday(date, manualHolidays);
}

export function calcDaysBetween(start, end, manualHolidays = new Set()) {
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

export function formatRange(start, end) {
  return `${toISODate(start)} \u2013 ${toISODate(end)}`;
}

export function parseTextRange(value) {
  const dates = (value || '').match(/\d{4}-\d{2}-\d{2}/g);
  if (!dates || dates.length !== 2) return null;
  const start = parseISODate(dates[0]);
  const end = parseISODate(dates[1]);
  if (!start || !end) return null;
  return start <= end ? [start, end] : [end, start];
}
