import { setFeedback } from '@helper/dom.js';
import { parseTextRange } from '@helper/date-utils.js';
import { createPeriod, getMaxDays } from '@helper/period.js';

export default function registerFormActions({
  elements,
  state,
  syncInputs,
  updateTable,
}, {
  closeActionsMenu,
}) {
  const {
    form,
    input,
    feedback,
    clearButton,
    addPeriodButton,
    periodTextInput,
  } = elements;

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
    state.maxDays = parsed;
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
      const period = createPeriod(start, end, false, state.manualHolidays);
      state.periods.push(period);
      if (periodTextInput) {
        periodTextInput.value = '';
        periodTextInput.dispatchEvent(new Event('change'));
      }
      updateTable();
      setFeedback(feedback, `Added ${period.days}-day period to planned days.`);
    });
  }

  clearButton.addEventListener('click', () => {
    state.maxDays = null;
    state.periods = [];
    state.manualHolidays = new Set();
    syncInputs();
    if (periodTextInput) {
      periodTextInput.value = '';
      periodTextInput.dispatchEvent(new Event('change'));
    }
    setFeedback(feedback, 'Data cleared.');
    updateTable();
    state.periodPickerApi?.render();
    closeActionsMenu();
  });
}
