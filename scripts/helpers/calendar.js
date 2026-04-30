import { MONTH_NAMES } from '@helper/constants.js';
import {
  addDays,
  formatRange,
  parseISODate,
  parseTextRange,
  toISODate,
} from '@helper/date-utils.js';
import { renderCalGrid } from '@helper/render.js';

export default function initPeriodPicker(
  container,
  { getManualHolidays, onManualHolidaysChange } = {},
) {
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

  function moveToMonth(monthDelta) {
    let nextMonth = viewMonth + monthDelta;
    let nextYear = viewYear;

    while (nextMonth < 0) {
      nextMonth += 12;
      nextYear -= 1;
    }

    while (nextMonth > 11) {
      nextMonth -= 12;
      nextYear += 1;
    }

    viewYear = nextYear;
    viewMonth = nextMonth;
    render();
  }

  function focusDateButton(iso) {
    if (!iso) return;
    const button = calGrid.querySelector(`[data-date="${iso}"]`);
    if (button instanceof HTMLButtonElement) {
      button.focus();
    }
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
    moveToMonth(-1);
  });

  nextBtn.addEventListener('click', () => {
    moveToMonth(1);
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

  calGrid.addEventListener('keydown', (event) => {
    const dayButton = event.target.closest('[data-date]');
    if (!dayButton) return;

    const currentDate = parseISODate(dayButton.dataset.date);
    if (!currentDate) return;

    let nextDate = null;
    if (event.key === 'ArrowLeft') nextDate = addDays(currentDate, -1);
    if (event.key === 'ArrowRight') nextDate = addDays(currentDate, 1);
    if (event.key === 'ArrowUp') nextDate = addDays(currentDate, -7);
    if (event.key === 'ArrowDown') nextDate = addDays(currentDate, 7);

    if (nextDate) {
      event.preventDefault();
      const nextIso = toISODate(nextDate);
      const nextMonth = nextDate.getMonth();
      const nextYear = nextDate.getFullYear();

      if (nextMonth !== viewMonth || nextYear !== viewYear) {
        viewMonth = nextMonth;
        viewYear = nextYear;
        render();
      }

      focusDateButton(nextIso);
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
      const delta = event.key === 'Home' ? -(dayOfWeek - 1) : (7 - dayOfWeek);
      const targetDate = addDays(currentDate, delta);

      if (targetDate.getMonth() !== viewMonth || targetDate.getFullYear() !== viewYear) {
        viewMonth = targetDate.getMonth();
        viewYear = targetDate.getFullYear();
        render();
      }

      focusDateButton(toISODate(targetDate));
      return;
    }

    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      const shift = event.key === 'PageUp' ? -1 : 1;
      moveToMonth(shift);

      const targetDay = currentDate.getDate();
      const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
      const targetDate = new Date(viewYear, viewMonth, Math.min(targetDay, lastDay));
      focusDateButton(toISODate(targetDate));
    }
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
