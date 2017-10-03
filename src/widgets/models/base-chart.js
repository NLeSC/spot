/**
 * Base Chart
 *
 * Base class to hold configuration for charts. Extend and override properties for each chart.
 * @class BaseChart
 */
var AmpersandModel = require('ampersand-model');
var Slots = require('./slots');

function titleForChart (chart) {
  var title = '';

  var aggregates = chart.filter.aggregates;
  if (aggregates.length === 0) {
    title = 'count';
  } else {
    aggregates.forEach(function (aggregate) {
      title += aggregate.operation + ' of ' + aggregate.label;
    });
  }

  title += ' by';

  var partitions = chart.filter.partitions;
  partitions.forEach(function (partition) {
    title += ' ' + partition.facetName;
  });
  return title;
}

module.exports = AmpersandModel.extend({
  collections: {
    slots: Slots
  },
  session: {
    /**
     * Filter instance
     * @memberof! Chart
     * @type {Filter}
     */
    filter: ['any', true, false],
    /**
     * True if the charts is properly configured; ie. all required slots are filled.
     */
    isConfigured: ['boolean', true, false]
  },
  getTitle: function () {
    return titleForChart(this);
  },
  updateConfiguration: function () {
    // without filter instance it cannot be configured
    if (!this.filter) {
      this.isConfigured = false;
    }

    var configured = true;

    // check if all required slots are filled
    this.slots.forEach(function (slot) {
      if (slot.required) {
        if (slot.type === 'partition') {
          if (!this.filter.partitions.get(slot.rank, 'rank')) {
            configured = false;
          }
        } else if (slot.type === 'aggregate') {
          if (!this.filter.aggregates.get(slot.rank, 'rank')) {
            configured = false;
          }
        } else {
          console.error('Illegal slot');
          configured = false;
        }
      }
    }, this);

    this.isConfigured = configured;
  }
});
