var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
  template: templates.includes.facetTransformTime,
  bindings: {
    'model.isTimeOrDuration': {
      type: 'toggle',
      hook: 'transform-time-panel'
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
    },

    // Bindings for: transform-time
    'model.transformTimeUnits': {
      type: 'value',
      hook: 'transform-time-units-input'
    },
    'model.transformTimeZone': {
      type: 'value',
      hook: 'transform-time-zone-input'
    },
    'model.transformTimeReference': {
      type: 'value',
      hook: 'transform-time-reference-input'
    }
  },
  events: {
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
    },
    'change [data-hook~=transform-time-units-input]': function () {
      this.model.transformTimeUnits = this.queryByHook('transform-time-units-input').value;
    },
    'change [data-hook~=transform-time-zone-input]': function () {
      this.model.transformTimeZone = this.queryByHook('transform-time-zone-input').value;
    },
    'change [data-hook~=transform-time-reference-input]': function () {
      this.model.transformTimeReference = this.queryByHook('transform-time-reference-input').value;
    }
  }
});
