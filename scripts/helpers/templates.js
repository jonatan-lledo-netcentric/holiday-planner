export function getPlannerTemplate(content = {}) {
  const {
    maxDaysLabel = 'Max holiday days for the year',
    maxDaysPlaceholder = 'e.g. 25',
    addMaxDaysButton = 'Add max days',
    summaryHeadUsedDays = 'Used days',
    summaryHeadPlannedDays = 'Planned/Upcoming days',
    summaryHeadUnplannedDays = 'Unplanned days',
    summaryHeadDaysLeft = 'Days left',
    summaryHeadTotalDays = 'Total days',
    periodsHeadDateRange = 'Date range',
    periodsHeadDays = 'Days',
    periodsHeadUsed = 'Used',
    periodsHeadRemove = 'Remove',
    actionsMenuAriaLabel = 'Open saved data actions',
    saveButtonLabel = 'Save',
    exportButtonLabel = 'Export JSON',
    importButtonLabel = 'Import JSON',
    clearSavedButtonLabel = 'Clear saved data',
    clearAllButtonLabel = 'Clear all',
    popupTitle = 'Import error',
    popupCloseLabel = 'Close',
    periodTitle = 'Add holiday period',
    periodDateRangeLabel = 'Date range',
    periodPlaceholder = 'YYYY-MM-DD \u2013 YYYY-MM-DD',
    addPeriodButtonLabel = 'Add period',
    manualHolidaysModeLabel = 'Manual holidays mode',
    prevMonthAriaLabel = 'Previous month',
    nextMonthAriaLabel = 'Next month',
    calendarAriaLabel = 'Date range picker',
  } = content;

  return `
    <form class="planner-form">
      <label for="planner-max-days">${maxDaysLabel}</label>
      <input
        class="tool-input"
        id="planner-max-days"
        name="planner-max-days"
        type="text"
        inputmode="numeric"
        placeholder="${maxDaysPlaceholder}"
        aria-describedby="planner-feedback"
      >
      <button class="tool-pill-button" type="submit">${addMaxDaysButton}</button>
      <p class="planner-feedback" id="planner-feedback" aria-live="polite" aria-atomic="true"></p>
    </form>
    <div class="planner-table-scroll tool-responsive-table-scroll">
      <table class="planner-table tool-responsive-table">
        <thead>
          <tr>
            <th scope="col">${summaryHeadUsedDays}</th>
            <th scope="col">${summaryHeadPlannedDays}</th>
            <th scope="col">${summaryHeadUnplannedDays}</th>
            <th scope="col">${summaryHeadDaysLeft}</th>
            <th scope="col">${summaryHeadTotalDays}</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
    <div class="planner-periods-table-scroll tool-responsive-table-scroll">
      <table class="planner-periods-table tool-responsive-table">
        <thead>
          <tr>
            <th scope="col">${periodsHeadDateRange}</th>
            <th scope="col">${periodsHeadDays}</th>
            <th scope="col">${periodsHeadUsed}</th>
            <th scope="col">${periodsHeadRemove}</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
    <div class="planner-actions">
      <div class="planner-actions-menu-wrap">
        <button
          class="planner-actions-toggle tool-pill-button"
          type="button"
          aria-haspopup="menu"
          aria-expanded="false"
          aria-controls="planner-actions-menu"
          aria-label="${actionsMenuAriaLabel}"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div class="planner-actions-menu tool-surface" id="planner-actions-menu" role="menu" hidden>
          <button class="planner-save tool-pill-button" type="button" role="menuitem">${saveButtonLabel}</button>
          <button class="planner-export tool-pill-button" type="button" role="menuitem">${exportButtonLabel}</button>
          <button class="planner-import tool-pill-button" type="button" role="menuitem">${importButtonLabel}</button>
          <button class="planner-clear-saved tool-pill-button" type="button" role="menuitem">${clearSavedButtonLabel}</button>
        </div>
      </div>
      <button class="planner-clear tool-pill-button" type="button">${clearAllButtonLabel}</button>
      <input
        type="file"
        class="planner-import-input"
        accept="application/json,.json"
        hidden
      >
    </div>
    <div class="planner-popup" hidden>
      <div class="planner-popup-content tool-surface" role="alertdialog" aria-modal="true" aria-labelledby="planner-popup-title" aria-describedby="planner-popup-message">
        <h3 class="planner-popup-title" id="planner-popup-title">${popupTitle}</h3>
        <p class="planner-popup-message" id="planner-popup-message"></p>
        <button class="planner-popup-close tool-pill-button" type="button">${popupCloseLabel}</button>
      </div>
    </div>
    <section class="planner-period">
      <h3 class="planner-period-title">${periodTitle}</h3>
      <label for="planner-period-text">${periodDateRangeLabel}</label>
      <div class="planner-period-controls">
        <input
          type="text"
          id="planner-period-text"
          class="planner-period-text tool-input"
          placeholder="${periodPlaceholder}"
          autocomplete="off"
        >
        <button type="button" class="planner-add-period tool-pill-button">${addPeriodButtonLabel}</button>
      </div>
      <label class="planner-manual-mode" for="planner-manual-mode">
        <input type="checkbox" id="planner-manual-mode" class="planner-manual-mode-input">
        ${manualHolidaysModeLabel}
      </label>
      <div class="planner-calendar tool-surface">
        <div class="planner-calendar-nav">
          <button type="button" class="planner-cal-prev" aria-label="${prevMonthAriaLabel}">&#8249;</button>
          <span class="planner-cal-label"></span>
          <button type="button" class="planner-cal-next" aria-label="${nextMonthAriaLabel}">&#8250;</button>
        </div>
        <div class="planner-cal-grid" role="grid" aria-label="${calendarAriaLabel}"></div>
      </div>
    </section>
  `;
}

export function getPeriodsTableRowsTemplate(periods = [], { formatRangeLabel } = {}) {
  if (periods.length === 0) {
    return '<tr class="planner-periods-empty tool-responsive-table-empty"><td colspan="4">No periods added yet.</td></tr>';
  }

  return periods.map((period, index) => {
    const checked = period.isUsed ? 'checked' : '';
    const displayLabel = typeof formatRangeLabel === 'function'
      ? formatRangeLabel(period.label)
      : period.label;

    return `<tr>
      <td data-label="Date range">${displayLabel}</td>
      <td data-label="Days">${period.days}</td>
      <td data-label="Used">
        <input
          type="checkbox"
          class="planner-period-used"
          data-index="${index}"
          aria-label="Mark ${displayLabel} as used"
          ${checked}
        >
      </td>
      <td data-label="Remove">
        <button
          type="button"
          class="planner-period-delete"
          data-index="${index}"
          aria-label="Remove ${displayLabel}"
          title="Remove"
        >
          <img src="/icons/trash.svg" alt="" aria-hidden="true" width="16" height="16">
        </button>
      </td>
    </tr>`;
  }).join('');
}
