/**
 * A filter provides a chart with an interface to the data.
 * The filter contains a number of `Partition`s an `Aggregate` and a `Selection`.
 * It takes care of calling the relevant functions provided by a `Dataset`.
 *
 * Basic usage is:
 * 1. The chart initializes the filter using `Filter.initDataFilter()`
 * 2. The chart listens to new data signals: `filter.on('newData', callback)`
 * 3. It calls `Filter.getData()`
 * 4. The filter arranges for the `Filter.data` array to be filled
 * 5. A `newData` event is triggerd, and the chart's callback function is executed
 * 6. When facets are added, removed, or updated the chart calls `Facet.releaseDataFilter()` and starts at 1 again.
 *
 * Selecting data on a chart would lead to the following:
 * 1. The user interacts with the chart, and selects some data
 * 2. The chart calls `Filter.updateDataFilter()`
 * 3. The filter does it thing and fills in the `Filter.data` array
 * 4. A `newData` event is triggerd, and the chart's callback function is executed
 *
 * @class Filter
 * @extends Selection
 */

/**
 * newData event
 * Indicates new data is available at Filter.data for plotting.
 *
 * @event Filter#newData
 */

/**
 * newFacets event
 * Indicates one of the facets has changed.
 *
 * @event Filter#newFacets
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

var Selection = require('./selection');
var Aggregate = require('./aggregate');
var Partitions = require('./partition-collection');

module.exports = Selection.extend({
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
      default: function () {
        return [];
      }
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
    }
  },

  // Initialize the Filter:
  // * set up callback to free internal state on remove
  initialize: function () {
    this.on('remove', function () {
      this.releaseDataFilter();
    }, this);
  },
  // reimplement the selection.reset() method to use the filter.primary facet
  reset: function () {
    this.clear();
    if (this.primary) {
      this.type = this.primary.displayType;
      this.isLogScale = this.primary.groupLog; // FIXME: something for aggregate page setting?
      this.groups = this.primary.groups; // FIXME Selections depend on primary.groups, make a copy? And what about 2D filtering?
    } else {
      // FIXME call method of parent class
      this.type = 'categorial';
      this.isLogScale = false;
      this.groups = [];
    }
  }
});
