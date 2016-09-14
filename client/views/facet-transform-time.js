var View = require('ampersand-view');
var templates = require('../templates');
var timePartsSelect = require('./time-parts-select');
var timeZonesSelect = require('./time-zones-select');

module.exports = View.extend({
  template: templates.includes.facetTransformTime,
  bindings: {
    'model.isTimeOrDuration': {
      type: 'toggle',
      hook: 'transform-time-panel'
    },

    'model.timeTransform.isDatetime': {
      type: 'booleanAttribute',
      hook: 'base-value-time-type-datetime-input',
      name: 'checked'
    },
    'model.timeTransform.isDuration': {
      type: 'booleanAttribute',
      hook: 'base-value-time-type-duration-input',
      name: 'checked'
    },

    // Bindings for: transform-time
    'model.timeTransform.transformedZone': {
      type: 'value',
      hook: 'transform-time-zone-input'
    },
    'model.timeTransform.transformedReference': {
      type: 'value',
      hook: 'transform-time-reference-input'
    }
  },
  events: {
    'click [data-hook~=base-value-time-type-datetime-input]': function () {
      this.model.timeTransform.type = 'datetime';
    },
    'click [data-hook~=base-value-time-type-duration-input]': function () {
      this.model.timeTransform.type = 'duration';
    },
    'change [data-hook~=transform-time-zone-input]': function () {
      this.model.timeTransform.transformedZone = this.queryByHook('transform-time-zone-input').value;
    },
    'change [data-hook~=transform-time-reference-input]': function () {
      this.model.timeTransform.transformedReference = this.queryByHook('transform-time-reference-input').value;
    }
  },
  subviews: {
    timeParts: {
      hook: 'time-parts',
      constructor: timePartsSelect
    },
    timeZones: {
      hook: 'time-zones',
      constructor: timeZonesSelect
    }
  }
});
