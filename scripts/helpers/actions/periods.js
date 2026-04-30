import { setFeedback } from '@helper/dom.js';

export default function registerPeriodsActions({
  elements,
  state,
  updateTable,
}) {
  const {
    feedback,
    periodsTbody,
  } = elements;

  periodsTbody.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.planner-period-used');
    if (!checkbox) return;
    const index = Number(checkbox.dataset.index);
    if (!Number.isInteger(index) || !state.periods[index]) return;
    state.periods[index].isUsed = checkbox.checked;
    updateTable();
    const message = checkbox.checked ? 'Period moved to used days.' : 'Period moved back to planned days.';
    setFeedback(feedback, message);
  });

  periodsTbody.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('.planner-period-delete');
    if (!deleteButton) return;
    const index = Number(deleteButton.dataset.index);
    if (!Number.isInteger(index) || !state.periods[index]) return;
    state.periods.splice(index, 1);
    updateTable();
    setFeedback(feedback, 'Period deleted.');
  });
}
