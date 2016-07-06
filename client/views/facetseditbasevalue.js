var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
  template: templates.includes.facetseditbasevalue,
  bindings: {
    'model.accessor': {
      type: 'value',
      hook: 'base-value-accessor-input'
    },
    'model.bccessor': {
      type: 'value',
      hook: 'base-value-bccessor-input'
    },
    'model.misvalAsText': {
      type: 'value',
      hook: 'base-value-missing-input'
    },
    'model.isProperty': {
      type: 'booleanAttribute',
      hook: 'base-value-kind-property',
      name: 'checked'
    },
    'model.isMath': {
      type: 'booleanAttribute',
      hook: 'base-value-kind-math',
      name: 'checked'
    }
  },
  events: {
    // events for: base-value
    'change [data-hook~=base-value-accessor-input]': function () {
      this.model.accessor = this.queryByHook('base-value-accessor-input').value;
    },
    'change [data-hook~=base-value-missing-input]': function () {
      this.model.misvalAsText = this.queryByHook('base-value-missing-input').value;
    },

    'click [data-hook~=base-value-kind-property]': function () {
      this.model.kind = 'property';
    },
    'click [data-hook~=base-value-kind-math]': function () {
      this.model.kind = 'math';
    }
  }
});
