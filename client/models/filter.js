/**
 * A filter provides a chart with an interface to the data.
 * The filter contains a number of `Partition`s and an `Aggregate`.
 * It takes care of calling the relevant functions provided by a `Dataset`.
 *
 * Basic usage for a Chart is:
 * 1. The chart renders using `Filter.data` if available
 * 2. The chart adds / removes partitions and aggregates to the filter
 * 3. The chart calls `Filter.updateDataFilter()` on user interaction
 * 4. The charts listens for 'newData' events on the filter
 *
 * The filter does the following:
 * 1. It adds or removes paritions and aggregates on request
 * 2. When it has the right number of partitions and aggregates, `Filter.isConfigured` becomes true
 *    and `Filter.initDataFilter()` is called
 * 3. As the new filter could affect all plots `Dataset.getAllData` called
 *
 * `Filter.getData` does the following:
 * 1. It arranges for the `Filter.data` array to be filled
 * 2. A `newData` event is triggerd, and the chart's callback function is executed
 *
 * @class Filter
 * @extends Base
 */

/**
 * newData event
 * Indicates new data is available at Filter.data for plotting.
 *
 * @event Filter#newData
 */

/**
 * newPartitioning event
 * Indicates the partitioning of a filter has changed.
 *
 * @event Filter#newPartitioning
 */

/**
 * @typedef {Object} DataRecord - Tripple holding the plot data
 * @property {string} DataRecord.a Group
 * @property {string} DataRecord.b Sub-group
 * @property {string} DataRecord.c Value
 */

/**
 * @typedef {DataRecord[]} Data - Array of DataRecords
 */

var Base = require('./base');
var Aggregate = require('./aggregate');
var Partitions = require('./partition-collection');

module.exports = Base.extend({
  props: {
    chartType: {
      type: 'string',
      required: true,
      default: 'barchart',
      values: ['piechart', 'horizontalbarchart', 'barchart', 'linechart', 'radarchart', 'polarareachart', 'bubbleplot']
    },
    /**
     * Title for displaying purposes
     * @memberof! Filter
     * @type {string}
     */
    title: ['string', true, '']
  },
  collections: {
    /**
     * @memberof! Filter
     * @type {Partitions[]}
     */
    partitions: Partitions
  },
  children: {
    /**
     * @memberof! Filter
     * @type {Aggregate}
     */
    aggregate: Aggregate
  },
  // Session properties are not typically persisted to the server,
  // and are not returned by calls to toJSON() or serialize().
  session: {
    /**
     * Array containing the data to plot
     * @memberof! Filter
     * @type {Data}
     */
    data: {
      type: 'array',
      default: null
    },
    /**
     * Call this function to request new data.
     * The dataset backing the facet will copy the data to Filter.data.
     * A newData event is fired when the data is ready to be plotted.
     * @function
     * @virtual
     * @memberof! Filter
     * @emits newData
     */
    getData: {
      type: 'any',
      default: null
    },
    /*
     * Minimum number of partitions required
     * @memberof! Chart
     * @type {number}
     */
    minPartitions: 'number',

    /*
     * Maximum number of partitions required
     * @memberof! Chart
     * @type {number}
     */
    maxPartitions: 'number'
  },
  derived: {
    isConfigured: {
      deps: ['minPartitions', 'maxPartitions', 'partitions'],
      cache: false,
      fn: function () {
        return (this.minPartitions <= this.partitions.length <= this.maxPartitions);
      }
    }
  },
  // Initialize the Filter:
  // * set up callback to free internal state on remove
  initialize: function () {
    this.partitions.on('change', function (partition, options) {
      if (this.isConfigured) {
        // categorial partitions manage their own groups
        if (partition.type !== 'categorial') {
          partition.setGroups();
        }
        partition.updateSelection();
        this.initDataFilter();
      } else {
        this.releaseDataFilter();
      }
    }, this);

    this.partitions.on('add remove', function (partition, partitionsb, options) {
      if (this.isConfigured) {
        this.initDataFilter();
      } else {
        this.releaseDataFilter();
      }
    }, this);
  },
  // Apply the separate filterFunctions from each partition in a single function
  filterFunction: function () {
    var fs = [];
    this.partitions.forEach(function (partition) {
      if (partition.selected.length > 0) {
        fs.push(partition.filterFunction());
      }
    });
    return function (d) {
      var result = true;
      fs.forEach(function (f) {
        result = result && f(d);
      });
      return result;
    };
  }
});
