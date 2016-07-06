var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
  template: templates.includes.facetseditbasevaluetime,
  bindings: {
    'model.isTime': {
      type: 'toggle',
      hook: 'base-value-time-panel'
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
