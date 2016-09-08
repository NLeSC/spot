var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
  template: templates.includes.facetTransformContinuous,
  bindings: {
    'model.isContinuous': {
      type: 'toggle',
      hook: 'transform-continuous-panel'
    },

    'model.transformNone': {
      type: 'booleanAttribute',
      hook: 'define-transform-none',
      name: 'checked'
    },
    'model.transformPercentiles': {
      type: 'booleanAttribute',
      hook: 'define-transform-percentiles',
      name: 'checked'
    },
    'model.transformExceedances': {
      type: 'booleanAttribute',
      hook: 'define-transform-exceedances',
      name: 'checked'
    }
  },
  events: {
    'click [data-hook~=define-transform-percentiles]': function () {
      this.model.continuousTransform.clear();
      this.model.setPercentiles();
    },
    'click [data-hook~=define-transform-exceedances]': function () {
      this.model.continuousTransform.clear();
      this.model.setExceedances();
    },
    'click [data-hook~=define-transform-none]': function () {
      this.model.continuousTransform.clear();
    }
  }
});
