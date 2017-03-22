/**
 * Base Chart
 *
 * Base class to hold configuration for charts. Extend and override properties for each chart.
 * @class BaseChart
 */
var BaseModel = require('../../../framework/util/base');
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

module.exports = BaseModel.extend({
  props: {
    /**
     * Minimum number of partitions this plot requires
     * @memberof! Chart
     * @type {number}
     */
    minPartitions: ['number', true, 1],

    /**
     * Maximum number of partitions this plot can visualize
     * @memberof! Chart
     * @type {number}
     */
    maxPartitions: ['number', true, 2]
  },
  collections: {
    slots: Slots
  },
  session: {
    /**
     * Filter instance
     * @memberof! Chart
     * @type {Filter}
     */
    filter: ['any', true, false]
  },
  getTitle: function () {
    return titleForChart(this);
  }
});
