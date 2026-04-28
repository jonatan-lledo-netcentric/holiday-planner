import { createElement } from '../../scripts/common.js';

function getMaxDays(value) {
  const trimmed = value.trim();
  const days = Number(trimmed);

  if (!trimmed || !Number.isInteger(days) || days < 0) {
    return null;
  }

  return days;
}

function renderPeriodsTable(tbody, periods = []) {
  let html = '';
  if (periods.length === 0) {
    html = '<tr><td colspan="3" style="text-align: center; color: #6b7280;">No periods added yet.</td></tr>';
  } else {
    periods.forEach((period, index) => {
      const checked = period.isUsed ? 'checked' : '';
      html += `<tr>
        <td>${period.label}</td>
        <td>${period.days}</td>
        <td>
          <input
            type="checkbox"
            class="planner-period-used"
            data-index="${index}"
            aria-label="Mark ${period.label} as used"
            ${checked}
          >
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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
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

function isBankHoliday(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return BANK_HOLIDAYS.includes(`${m}-${d}`);
}

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isWorkingDay(date) {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  return !isWeekend && !isBankHoliday(date);
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
  const remainingDays = Math.max(totalDays - usedDays, 0);

  return {
    usedDays,
    plannedUpcomingDays,
    remainingDays,
    totalDays,
  };
}

function renderTableBody(tbody, maxDays, periods = []) {
  const summary = getSummaryDays(periods, maxDays);
  const html = `<tr>
    <td>${summary.usedDays}</td>
    <td>${summary.plannedUpcomingDays}</td>
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

function calcDaysBetween(start, end) {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    if (isWorkingDay(current)) {
      count += 1;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function formatRange(start, end) {
  return `${toISODate(start)} \u2013 ${toISODate(end)}`;
}

function renderCalGrid(grid, viewYear, viewMonth, rangeStart, rangeEnd, previewDate) {
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
    const isBankHol = isBankHoliday(date);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    const classes = ['planner-cal-day'];
    if (isStart) classes.push('is-start');
    if (isEnd) classes.push('is-end');
    if (inRange) classes.push(isPreviewActive ? 'is-preview' : 'in-range');
    if (iso === today) classes.push('is-today');
    if (isBankHol) classes.push('is-bank-holiday');
    if (isWeekend) classes.push('is-weekend');

    cells += `<button type="button" class="${classes.join(' ')}" data-date="${iso}" aria-label="${iso}">${d}</button>`;
  }

  grid.innerHTML = heads + empties + cells;
}

function initPeriodPicker(container) {
  const textInput = container.querySelector('.planner-period-text');
  const calLabel = container.querySelector('.planner-cal-label');
  const calGrid = container.querySelector('.planner-cal-grid');
  const prevBtn = container.querySelector('.planner-cal-prev');
  const nextBtn = container.querySelector('.planner-cal-next');

  if (!textInput || !calLabel || !calGrid || !prevBtn || !nextBtn) return;

  const now = new Date();
  let viewYear = now.getFullYear();
  let viewMonth = now.getMonth();
  let rangeStart = null;
  let rangeEnd = null;
  let previewDate = null;
  let selecting = 'start';

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
    renderCalGrid(calGrid, viewYear, viewMonth, rangeStart, rangeEnd, previewDate);
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
    if (selecting !== 'end') return;
    const btn = event.target.closest('[data-date]');
    const hoverIso = btn ? btn.dataset.date : null;
    previewDate = btn ? parseISODate(hoverIso) : null;
    applyPreview(hoverIso);
  });

  calGrid.addEventListener('mouseleave', () => {
    if (selecting !== 'end') return;
    previewDate = null;
    applyPreview(null);
  });

  textInput.addEventListener('change', () => {
    const textValue = textInput.value.trim();
    if (!textValue) {
      rangeStart = null;
      rangeEnd = null;
      previewDate = null;
      selecting = 'start';
      render();
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

  render();
}

export default function decorate(block) {
  let maxDays = null;
  let periods = [];

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
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <button class="planner-clear" type="button">Clear all</button>
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
  const clearButton = wrapper.querySelector('.planner-clear');
  const periodContainer = wrapper.querySelector('.planner-period');
  const periodTextInput = wrapper.querySelector('.planner-period-text');
  const addPeriodButton = wrapper.querySelector('.planner-add-period');

  if (!form || !input || !feedback || !tbody || !clearButton || !periodsTbody) {
    block.replaceChildren(wrapper);
    return;
  }

  function updateTable() {
    renderTableBody(tbody, maxDays, periods);
    renderPeriodsTable(periodsTbody, periods);
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
      const days = calcDaysBetween(start, end);
      const label = formatRange(start, end);

      periods.push({
        label,
        days,
        start,
        end,
        isUsed: false,
      });
      periodTextInput.value = '';
      updateTable();
      setFeedback(feedback, `Added ${days}-day period to planned days.`);
    });
  }

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

  clearButton.addEventListener('click', () => {
    maxDays = null;
    periods = [];
    input.value = '';
    periodTextInput.value = '';
    setFeedback(feedback, 'Data cleared.');
    updateTable();
  });

  updateTable();
  if (periodContainer) initPeriodPicker(periodContainer);
  block.replaceChildren(wrapper);
}
