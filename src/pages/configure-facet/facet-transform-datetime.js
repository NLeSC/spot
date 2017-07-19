var View = require('ampersand-view');
var templates = require('../../templates');
var TimePartsSelect = require('./time-parts-select');
var TimeZonesSelect = require('./time-zones-select');
var DurationUnitsSelect = require('./duration-units-select');

module.exports = View.extend({
  template: templates.configureFacet.facetTransformDatetime,
  bindings: {
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
    'change [data-hook~=transform-time-zone-input]': function () {
      this.model.zone = this.queryByHook('transform-time-zone-input').value;
    },
    'change [data-hook~=transform-time-format-input]': function () {
      this.model.format = this.queryByHook('transform-time-format-input').value;
    },
    'change [data-hook~=transform-time-transformedzone-input]': function () {
      this.model.transformedZone = this.queryByHook('transform-time-transformedzone-input').value;
    },
    'change [data-hook~=transform-time-transformedformat-input]': function () {
      this.model.transformedFormat = this.queryByHook('transform-time-transformedformat-input').value;
    },
    'change [data-hook~=transform-time-transformedreference-input]': function () {
      this.model.transformedReference = this.queryByHook('transform-time-transformedreference-input').value;
    },
    'change [data-hook~=transform-time-transformedunits-input]': function () {
      this.model.transformedReference = this.queryByHook('transform-time-transformedunits-input').value;
    }
  },
  subviews: {
    timeParts: {
      hook: 'time-parts',
      prepareView: function (el) {
        return new TimePartsSelect({
          el: el,
          model: this.model
        });
      }
    },
    timeZones: {
      hook: 'time-zones',
      prepareView: function (el) {
        return new TimeZonesSelect({
          el: el,
          field: 'zone',
          model: this.model
        });
      }
    },
    transformedTimeZones: {
      hook: 'transformed-time-zones',
      prepareView: function (el) {
        return new TimeZonesSelect({
          el: el,
          field: 'transformedZone',
          model: this.model
        });
      }
    },
    transformedTimeUnits: {
      hook: 'transformed-time-units',
      constructor: DurationUnitsSelect
    }
  }
});
