export default function registerMenuActions({ elements }) {
  const {
    actionsMenuWrap,
    actionsToggle,
    actionsMenu,
  } = elements;

  const closeActionsMenu = () => {
    actionsMenu.hidden = true;
    actionsToggle.setAttribute('aria-expanded', 'false');
  };

  const openActionsMenu = () => {
    actionsMenu.hidden = false;
    actionsToggle.setAttribute('aria-expanded', 'true');
    const firstMenuItem = actionsMenu.querySelector('[role="menuitem"]');
    if (firstMenuItem instanceof HTMLButtonElement) {
      firstMenuItem.focus();
    }
  };

  const toggleActionsMenu = () => {
    if (actionsMenu.hidden) {
      openActionsMenu();
      return;
    }
    closeActionsMenu();
  };

  actionsToggle.addEventListener('click', toggleActionsMenu);

  actionsToggle.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (actionsMenu.hidden) {
        openActionsMenu();
      }
    }
  });

  actionsMenu.addEventListener('keydown', (event) => {
    const menuItems = [...actionsMenu.querySelectorAll('[role="menuitem"]')];
    if (menuItems.length === 0) return;
    const currentIndex = menuItems.indexOf(document.activeElement);

    if (event.key === 'Escape') {
      event.preventDefault();
      closeActionsMenu();
      actionsToggle.focus();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = currentIndex >= 0
        ? (currentIndex + direction + menuItems.length) % menuItems.length
        : 0;
      menuItems[nextIndex].focus();
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const targetIndex = event.key === 'Home' ? 0 : menuItems.length - 1;
      menuItems[targetIndex].focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (actionsMenu.hidden) return;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const clickedInsideActions = path.length > 0
      ? path.includes(actionsMenuWrap)
      : actionsMenuWrap.contains(event.target);
    if (!clickedInsideActions) {
      closeActionsMenu();
    }
  });

  return {
    closeActionsMenu,
    openActionsMenu,
  };
}
