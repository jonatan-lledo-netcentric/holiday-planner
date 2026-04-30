export default function registerPopupActions({ elements, state }) {
  const {
    popup,
    popupMessage,
    popupCloseButton,
  } = elements;

  const openPopup = (message) => {
    state.popupReturnFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    popupMessage.textContent = message;
    popup.hidden = false;
    popupCloseButton.focus();
  };

  const closePopup = () => {
    popup.hidden = true;
    popupMessage.textContent = '';
    if (state.popupReturnFocus instanceof HTMLElement) {
      state.popupReturnFocus.focus();
    }
    state.popupReturnFocus = null;
  };

  popupCloseButton.addEventListener('click', closePopup);

  popup.addEventListener('click', (event) => {
    if (event.target === popup) {
      closePopup();
    }
  });

  return {
    openPopup,
    closePopup,
  };
}
