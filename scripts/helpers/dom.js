export function getElements(wrapper) {
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

  const required = [
    form, input, feedback, tbody, periodsTbody, popup, popupMessage,
    popupCloseButton, actionsMenuWrap, actionsToggle, actionsMenu,
    saveButton, exportButton, importButton, clearSavedButton, clearButton, importInput,
  ];

  if (required.some((el) => !el)) {
    return null;
  }

  return {
    form,
    input,
    feedback,
    tbody,
    periodsTbody,
    popup,
    popupMessage,
    popupCloseButton,
    actionsMenuWrap,
    actionsToggle,
    actionsMenu,
    saveButton,
    exportButton,
    importButton,
    clearSavedButton,
    clearButton,
    importInput,
    periodContainer,
    periodTextInput,
    addPeriodButton,
  };
}

export function setFeedback(feedback, message, isError = false) {
  feedback.textContent = message;
  feedback.classList.toggle('is-error', isError);
}
