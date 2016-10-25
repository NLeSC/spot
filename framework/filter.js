/**
 * A filter provides a chart with an interface to the data.
 * The filter contains a number of `Partition`s and `Aggregate`s.
 * It takes care of calling the relevant functions provided by a `Dataset`.
 *
 * Basic usage for a Chart is:
 * 1. The chart renders using `Filter.data` if available
 * 2. It can add or remove partitions and aggregates to the filter
 * 3. It calls `Filter.updateSelection(..)` when the user makes a selection
 * 4. To apply the new selection, and also filter the other charts, the chart calls `Filter.updateDataFilter()`
 * 5. The charts redraws on 'newData' events on the filter
 *
 * The filter does the following:
 * 1. It adds or removes paritions and aggregates on request
 * 2. When it has the right number of partitions and aggregates, `Filter.isConfigured` becomes true
 *    and `Filter.initDataFilter()` is called
 * 3. This in turn creates a `Filter.getData` function
 * 4. As the new filter could affect all plots `Dataset.getAllData` called
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
 * @typedef {Object} DataRecord - Object holding the plot data, partitions are labelled with a single small letter, aggregates with a double small letter
 * @property {string} DataRecord.a Value of first partition
 * @property {string} DataRecord.b Value of second partition
 * @property {string} DataRecord.c Value of third partition, etc.
 * @property {string} DataRecord.aa Value of first aggregate
 * @property {string} DataRecord.bb Value of second aggregate, etc.
 */

/**
 * @typedef {DataRecord[]} Data - Array of DataRecords
 */

var Base = require('./base');
var Aggregates = require('./aggregate-collection');
var Partitions = require('./partition-collection');

module.exports = Base.extend({
  props: {
    chartType: {
      type: 'string',
      required: true,
      default: 'barchart',
      values: ['piechart', 'horizontalbarchart', 'barchart', 'linechart', 'radarchart', 'polarareachart', 'bubbleplot', 'plotly3dchart', 'networkchart']
    },
    /**
     * Title for displaying purposes
     * @memberof! Filter
     * @type {string}
     */
    title: ['string', true, ''],
    /**
     * gridster configuration:
     * position (col, row) and size (size_x, size_y) of chart
     */
    col: 'number',
    row: 'number',
    size_x: 'number',
    size_y: 'number'
  },
  collections: {
    /**
     * @memberof! Filter
     * @type {Partitions[]}
     */
    partitions: Partitions,
    /**
     * @memberof! Filter
     * @type {Aggregate[]}
     */
    aggregates: Aggregates
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
      deps: ['minPartitions', 'maxPartitions', 'partitions', 'minAggregates', 'maxAggregates', 'aggregates'],
      cache: false,
      fn: function () {
        var p = this.partitions.length;
        var a = this.aggregates.length;

        var partitionsOk = (this.minPartitions <= p && p <= this.maxPartitions);
        var aggregatesOk = (this.minAggregates <= a && a <= this.maxAggregates);
        return partitionsOk && aggregatesOk;
      }
    }
  },
  // Initialize the Filter:
  // * set up callback to free internal state on remove
  initialize: function () {
    this.partitions.on('change', function (partition, options) {
      if (this.isConfigured) {
        if (partition.type !== 'categorial') {
          partition.setGroups();
        }
        this.initDataFilter();
      } else {
        this.releaseDataFilter();
      }
    }, this);

    this.partitions.on('add', function (partition, partitions, options) {
      partition.reset({ silent: true });
      partition.setGroups();
      if (this.isConfigured) {
        this.initDataFilter();
      }
    }, this);

    this.partitions.on('remove', function () {
      this.releaseDataFilter();
      if (this.isConfigured) {
        this.initDataFilter();
      }
    }, this);

    this.on('remove', function () {
      this.releaseDataFilter();
    });
  },
  zoomIn: function () {
    this.partitions.forEach(function (partition) {
      if ((partition.selected.length === 2) && (partition.isDatetime || partition.isContinuous)) {
        // zoom to selected range, if possible
        partition.set({
          minval: partition.selected[0],
          maxval: partition.selected[1],
          groupingParam: 20,
          groupingContinuous: 'fixedn'
        }, { silent: true });
        partition.setGroups();
      } else if (partition.selected.length > 0 && (partition.isCategorial)) {
        // zoom to selected categories, if possible
        partition.groups.reset();
        partition.selected.forEach(function (value) {
          partition.groups.add({
            value: value,
            label: value,
            count: 0,
            isSelected: true
          });
        });
      }
      // select all
      partition.selected.splice(0, partition.selected.length);
    });
    this.initDataFilter();
  },
  zoomOut: function () {
    this.partitions.forEach(function (partition) {
      if (partition.isDatetime || partition.isContinuous) {
        partition.reset({ silent: true });
      }
      partition.setGroups();
      partition.selected.splice(0, partition.selected.length);
    });
    this.initDataFilter();
  },
  // Apply the separate filterFunctions from each partition in a single function
  filterFunction: function () {
    var fs = [];
    this.partitions.forEach(function (partition) {
      fs.push(partition.filterFunction());
    });
    return function (d) {
      if (typeof d === 'string') {
        var groups = d.split('|');
        return fs.every(function (f, i) { return f(groups[i]); });
      } else {
        // shortcut for non-partitioned numeric data
        return fs[0](d);
      }
    };
  }
});
