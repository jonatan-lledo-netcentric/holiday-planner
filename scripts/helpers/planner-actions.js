import { createPeriod } from '@helper/period.js';
import { renderPeriodsTable, renderTableBody } from '@helper/render.js';
import initPeriodPicker from '@helper/calendar.js';
import registerPopupActions from '@helper/actions/popup.js';
import registerMenuActions from '@helper/actions/menu.js';
import registerFormActions from '@helper/actions/form.js';
import registerStorageActions from '@helper/actions/storage.js';
import registerPeriodsActions from '@helper/actions/periods.js';

export default function registerPlannerActions(elements) {
  const {
    form,
    input,
    tbody,
    periodsTbody,
    popup,
    actionsMenu,
    actionsToggle,
    periodContainer,
  } = elements;

  const state = {
    maxDays: null,
    periods: [],
    manualHolidays: new Set(),
    periodPickerApi: null,
    popupReturnFocus: null,
  };

  const syncInputs = () => {
    input.value = state.maxDays === null ? '' : String(state.maxDays);
  };

  const updateTable = () => {
    renderTableBody(tbody, state.maxDays, state.periods);
    renderPeriodsTable(periodsTbody, state.periods);
  };

  const recalculatePeriods = () => {
    state.periods = state.periods.map((period) => createPeriod(
      period.start,
      period.end,
      period.isUsed,
      state.manualHolidays,
    ));
    updateTable();
  };

  const applyPlannerState = (nextMaxDays, nextPeriods, nextManualHolidays = new Set()) => {
    state.maxDays = nextMaxDays;
    state.periods = nextPeriods;
    state.manualHolidays = new Set(nextManualHolidays);
    syncInputs();
    updateTable();
    state.periodPickerApi?.render();
  };

  const context = {
    elements,
    state,
    syncInputs,
    updateTable,
    applyPlannerState,
  };

  const { openPopup, closePopup } = registerPopupActions(context);
  const { closeActionsMenu } = registerMenuActions(context);

  registerFormActions(context, { closeActionsMenu });
  registerStorageActions(context, {
    openPopup,
    closePopup,
    closeActionsMenu,
  });
  registerPeriodsActions(context);

  form.closest('.planner-wrapper')?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !popup.hidden) {
      closePopup();
      return;
    }
    if (event.key === 'Escape' && !actionsMenu.hidden) {
      closeActionsMenu();
      actionsToggle.focus();
    }
  });

  if (periodContainer) {
    state.periodPickerApi = initPeriodPicker(periodContainer, {
      getManualHolidays: () => state.manualHolidays,
      onManualHolidaysChange: (nextManualHolidays) => {
        state.manualHolidays = new Set(nextManualHolidays);
        recalculatePeriods();
      },
    });
  }
}
