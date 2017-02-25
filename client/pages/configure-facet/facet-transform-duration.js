var View = require('ampersand-view');
var templates = require('../../templates');
var TimeZonesSelect = require('./time-zones-select');
var DurationUnitsSelect = require('./duration-units-select');

module.exports = View.extend({
  template: templates.configureFacet.facetTransformDuration,
  bindings: {
    'model.transformedReference': {
      type: 'value',
      hook: 'transform-duration-transformedreference-input'
    }
  },
  events: {
    'change [data-hook~=transform-duration-transformedreference-input]': function () {
      this.model.transformedReference = this.queryByHook('transform-duration-transformedreference-input').value;
    }
  },
  subviews: {
    durationUnits: {
      hook: 'duration-units',
      prepareView: function (el) {
        return new DurationUnitsSelect({
          el: el,
          field: 'units',
          model: this.model
        });
      }
    },
    transformedDurationUnits: {
      hook: 'transformed-duration-units',
      prepareView: function (el) {
        return new DurationUnitsSelect({
          el: el,
          field: 'transformedUnits',
          model: this.model
        });
      }
    },
    timeZones: {
      hook: 'transformed-duration-zone',
      prepareView: function (el) {
        return new TimeZonesSelect({
          el: el,
          field: 'transformedZone',
          model: this.model
        });
      }
    }
  }
});
