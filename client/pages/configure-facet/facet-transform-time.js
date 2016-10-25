var View = require('ampersand-view');
var templates = require('../../templates');
var timePartsSelect = require('./time-parts-select');
var timeZonesSelect = require('./time-zones-select');
var durationUnitsSelect = require('./duration-units-select');

module.exports = View.extend({
  template: templates.configureFacet.facetTransformTime,
  bindings: {
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

    'model.transformedZone': {
      type: 'value',
      hook: 'transform-time-zone-input'
    },
    'model.transformedReference': {
      type: 'value',
      hook: 'transform-time-reference-input'
    }
  },
  events: {
    'click [data-hook~=base-value-time-type-datetime-input]': function () {
      this.model.type = 'datetime';
    },
    'click [data-hook~=base-value-time-type-duration-input]': function () {
      this.model.type = 'duration';
    },
    'change [data-hook~=transform-time-zone-input]': function () {
      this.model.transformedZone = this.queryByHook('transform-time-zone-input').value;
    },
    'change [data-hook~=transform-time-reference-input]': function () {
      this.model.transformedReference = this.queryByHook('transform-time-reference-input').value;
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
    },
    durationUnits: {
      hook: 'duration-units',
      constructor: durationUnitsSelect
    }
  }
});
