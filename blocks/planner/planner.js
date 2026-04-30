import { getPlannerTemplate } from '@helper/templates.js';
import { getElements } from '@helper/dom.js';
import registerPlannerActions from '@helper/planner-actions.js';
import { createElement } from '../../scripts/common.js';

export default function decorate(block) {
  const wrapper = createElement('div', {
    className: 'planner-wrapper tool-surface tool-focus-ring',
    innerContent: getPlannerTemplate(),
  });

  const elements = getElements(wrapper);
  if (!elements) {
    block.replaceChildren(wrapper);
    return;
  }

  registerPlannerActions(elements);
  block.replaceChildren(wrapper);
}
