var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
  template: templates.includes.facetseditbasevalue,
  bindings: {
    'model.isTime': {
      type: 'toggle',
      hook: 'base-value-time-panel'
    },

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
    },

    'model.baseValueTimeFormat': {
      type: 'value',
      hook: 'base-value-time-format-input'
    },
    'model.baseValueTimeZone': {
      type: 'value',
      hook: 'base-value-time-zone-input'
    },
    'model.isDatetime': {
      type: 'booleanAttribute',
      hook: 'base-value-time-type-datetime-input',
      name: 'checked'
    },
    'model.isDuration': {
      type: 'booleanAttribute',
      hook: 'base-value-time-type-duration-input',
      name: 'checked'
    }
  },
  events: {
    // events for: base-value
    'change [data-hook~=base-value-accessor-input]': function () {
      this.model.accessor = this.queryByHook('base-value-accessor-input').value;
    },
    'change [data-hook~=base-value-bccessor-input]': function () {
      this.model.bccessor = this.queryByHook('base-value-bccessor-input').value;
    },
    'change [data-hook~=base-value-missing-input]': function () {
      this.model.misvalAsText = this.queryByHook('base-value-missing-input').value;
    },

    'click [data-hook~=base-value-kind-property]': function () {
      this.model.kind = 'property';
    },
    'click [data-hook~=base-value-kind-math]': function () {
      this.model.kind = 'math';
    },

    // events for: base-value-time
    'change [data-hook~=base-value-time-format-input]': function () {
      this.model.baseValueTimeFormat = this.queryByHook('base-value-time-format-input').value;
    },
    'change [data-hook~=base-value-time-zone-input]': function () {
      this.model.baseValueTimeZone = this.queryByHook('base-value-time-zone-input').value;
    },

    'click [data-hook~=base-value-time-type-datetime-input]': function () {
      this.model.baseValueTimeType = 'datetime';
    },
    'click [data-hook~=base-value-time-type-duration-input]': function () {
      this.model.baseValueTimeType = 'duration';
    }
  }
});
