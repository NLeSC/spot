var View = require('ampersand-view');
var templates = require('../../templates');

module.exports = View.extend({
  template: templates.includes.facetTransformContinuous,
  bindings: {
    'model.isNone': {
      type: 'booleanAttribute',
      hook: 'define-transform-none',
      name: 'checked'
    },
    'model.isPercentiles': {
      type: 'booleanAttribute',
      hook: 'define-transform-percentiles',
      name: 'checked'
    },
    'model.isExceedances': {
      type: 'booleanAttribute',
      hook: 'define-transform-exceedances',
      name: 'checked'
    }
  },
  events: {
    'click [data-hook~=define-transform-percentiles]': function () {
      this.model.clear();
      this.model.setPercentiles();
    },
    'click [data-hook~=define-transform-exceedances]': function () {
      this.model.clear();
      this.model.setExceedances();
    },
    'click [data-hook~=define-transform-none]': function () {
      this.model.clear();
    }
  }
});
