import { setFeedback } from '@helper/dom.js';
import {
  clearSavedPlannerState,
  downloadPlannerState,
  loadPlannerState,
  reportInvalidPlannerData,
  savePlannerState,
  validatePlannerState,
} from '@helper/storage.js';

export default function registerStorageActions({
  elements,
  state,
  updateTable,
  applyPlannerState,
}, {
  openPopup,
  closePopup,
  closeActionsMenu,
}) {
  const {
    feedback,
    saveButton,
    exportButton,
    importButton,
    clearSavedButton,
    importInput,
  } = elements;

  saveButton.addEventListener('click', () => {
    savePlannerState(state.maxDays, state.periods, state.manualHolidays);
    setFeedback(feedback, 'Planner data saved to local storage.');
    closeActionsMenu();
  });

  exportButton.addEventListener('click', () => {
    downloadPlannerState(state.maxDays, state.periods, state.manualHolidays);
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

  importInput.addEventListener('change', async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validatedState = validatePlannerState(parsed, { onError: openPopup });
      if (!validatedState) return;
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

  const savedState = loadPlannerState();
  if (savedState) {
    applyPlannerState(savedState.maxDays, savedState.periods, savedState.manualHolidays);
    setFeedback(feedback, 'Loaded saved planner data from local storage.');
  } else {
    updateTable();
  }
}
