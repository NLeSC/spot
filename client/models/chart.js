/**
 * Chart
 *
 * Base class to hold configuration for charts. Extend and override properties for each chart.
 * Implementations for horizontalbarchart, barchart, linechart, piechart, polarareachart, and radarchart from ChartJS are implemented.
 * @class Chart
 */
var BaseModel = require('./base');

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
    maxPartitions: ['number', true, 2],

    /**
     * Minimum number of aggregates this plot requires
     * Note that when no aggregates are defined, a `count(*)` is used as default.
     * @memberof! Chart
     * @type {number}
     */
    minAggregates: ['number', true, 0],

    /**
     * Maximum number of aggregates this plot can visualize
     * @memberof! Chart
     * @type {number}
     */
    maxAggregates: ['number', true, 1]
  },
  session: {
    /**
     * Filter instance
     * @memberof! Chart
     * @type {Filter}
     */
    filter: ['any', true, false]
  }
});
