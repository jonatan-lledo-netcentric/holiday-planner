/**
 * Converts variant classes to BEM notation and updates the block's class list accordingly.
 * @param {Object} params The parameters object.
 * @param {DOMTokenList} params.blockClassList The class list of the block element.
 * @param {Object} params.variantClasses An object where keys are variant class names.
 * @param {string} params.blockName The base name of the block.
 * @return {void}
 * @example
 * // Given a block with class 'hero large' and variantClasses { large: 'large', dark: 'dark' }
 * // and blockName 'hero', the function will update the class list to 'hero hero__large hero__dark'
 * variantClassesToBEM({
 *   blockClassList: blockElement.classList,
 *   variantClasses: { large: 'large', dark: 'dark' },
 *   blockName: 'hero'
 * });
 * // Resulting class list: 'hero hero__large hero__dark'
 */
export function variantClassesToBEM({ blockClassList = '', variantClasses = {}, blockName = '' }) {
  const variants = [...Object.keys(variantClasses)];
  variants.forEach((variant) => {
    if (blockClassList.contains(variant)) {
      blockClassList.remove(variant);
      blockClassList.add(`${blockName}__${variant}`);
    }
  });
}

/**
 * Generates a BEM template name for a given block and variant.
 * @param {Object} params The parameters object.
 * @param {string} params.blockName The base name of the block.
 * @param {string} params.variantName The name of the variant.
 * @param {string} [params.modifierName=''] An optional modifier name.
 * @param {string} [params.variantClass=''] An optional BEM base name override.
 * @return {string} The BEM formatted template name.
 * @example
 * // Generate BEM template name for block 'hero' and variant 'countdown'
 * const templateName = getBEMTemplateName({ blockName: 'hero', variantName: 'countdown' });
 * // Result: 'hero__countdown'
 * @example
 * // Generate BEM template name with modifier
 * const templateNameWithModifier = getBEMTemplateName({
 *   blockName: 'button',
 *   variantName: 'primary',
 *   modifierName: 'large'
 * });
 * // Result: 'button__primary--large'
 * @example
 * // Generate BEM template name using custom variant class as base name
 * const templateNameCustom = getBEMTemplateName({
 *   variantClass: 'btn__custom',
 *   modifierName: 'active'
 * });
 * // Result: 'btn__custom--active'
 */
export function getBEMTemplateName({
  blockName, variantName, modifierName = '', variantClass = '',
}) {
  const baseName = variantClass || `${blockName}__${variantName}`;
  return `${baseName}${modifierName ? `--${modifierName}` : ''}`;
}

/**
 * Creates a DOM element with specified options.
 * @param {string} tag The HTML tag name for the element. [Mandatory]
 * @param {Object} [options={}] The options for creating the element.
 * @param {string|string[]} [options.className=''] The class name(s) to add to the element.
 * Can be a single class, space-separated, comma-separated, or an array.
 * @param {Object} [options.properties={}] The properties to set on the element.
 * @param {string} [options.innerContent=''] Can be plain text or an HTML fragment.
 * @return {Element} The created DOM element.
 * @example
 * // Single class
 * const element = createElement('div', { className: 'container' });
 * // Result: <div class="container"></div>
 * @example
 * // Space-separated classes
 * const element = createElement('div', { className: 'container large' });
 * // Result: <div class="container large"></div>
 * @example
 * // Comma-separated classes
 * const element = createElement('div', { className: 'container,large,primary' });
 * // Result: <div class="container large primary"></div>
 * @example
 * // Array of classes
 * const element = createElement('div', { className: ['container', 'large', 'primary'] });
 * // Result: <div class="container large primary"></div>
 * @example
 * // With properties and text content
 * const element = createElement('div', {
 *   className: 'container large',
 *   attributes: { id: 'main' },
 *   innerContent: 'Hello World'
 * });
 * // Result: <div class="container large" id="main">Hello World</div>
 * @example
 * // With HTML fragment
 * const element = createElement('div', {
 *   className: 'container',
 *   innerContent: '<p>Nested content</p>'
 * });
 * // Result: <div class="container"><p>Nested content</p></div>
*/
export function createElement(tag, options = {}) {
  const {
    className = '', attributes = {}, innerContent = '',
  } = options;
  const element = document.createElement(tag);
  const isString = typeof className === 'string' || className instanceof String;
  if (className || (isString && className !== '') || (!isString && className.length > 0)) {
    const classes = isString ? className.split(/[\s,]+/).filter(Boolean) : className;
    element.classList.add(...classes);
  }
  if (!isString && className.length === 0) {
    element.removeAttribute('class');
  }

  if (attributes) {
    Object.keys(attributes).forEach((propName) => {
      const value = propName === attributes[propName] ? '' : attributes[propName];
      element.setAttribute(propName, value);
    });
  }

  if (innerContent) {
    const fragmentNode = document.createRange().createContextualFragment(innerContent);
    element.appendChild(fragmentNode);
  }

  return element;
}

const THEME_STORAGE_KEY = 'holiday-planner-theme';
const DARK_THEME_QUERY = '(prefers-color-scheme: dark)';

/**
 * Returns the saved theme preference.
 * @returns {'light'|'dark'|null}
 */
export function getStoredTheme() {
  try {
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    return theme === 'light' || theme === 'dark' ? theme : null;
  } catch (e) {
    return null;
  }
}

/**
 * Resolves the current system theme.
 * @returns {'light'|'dark'}
 */
export function getSystemTheme() {
  return window.matchMedia(DARK_THEME_QUERY).matches ? 'dark' : 'light';
}

/**
 * Resolves the active theme from explicit preference or system default.
 * @returns {'light'|'dark'}
 */
export function resolveTheme() {
  return getStoredTheme() || getSystemTheme();
}

/**
 * Applies a theme on the root element and emits a change event.
 * @param {'light'|'dark'} theme The theme to apply
 */
export function applyTheme(theme) {
  if (theme !== 'light' && theme !== 'dark') return;
  document.documentElement.setAttribute('data-theme', theme);
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

/**
 * Sets and persists an explicit theme preference.
 * @param {'light'|'dark'} theme The theme preference to save
 */
export function setThemePreference(theme) {
  if (theme !== 'light' && theme !== 'dark') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    // ignore storage failures and still apply theme
  }
  applyTheme(theme);
}

/**
 * Applies the initial theme preference during page load.
 * @returns {'light'|'dark'}
 */
export function initializeTheme() {
  const theme = resolveTheme();
  applyTheme(theme);
  return theme;
}

/**
 * Tracks system preference changes while no explicit choice is stored.
 */
export function listenForSystemThemeChanges() {
  const media = window.matchMedia(DARK_THEME_QUERY);
  media.addEventListener('change', (event) => {
    if (!getStoredTheme()) {
      applyTheme(event.matches ? 'dark' : 'light');
    }
  });
}
