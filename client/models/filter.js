/**
 * Filter
 *
 * @class Filter
 * @extends Selection
 */

/**
 * newdata event
 * Indicates new data is available at Filter.data for plotting.
 *
 * @event Filter#newdata
 */

/**
 * newfacets event
 * Indicates one of the facets has changed.
 *
 * @event Filter#newfacets
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

var Facet = require('./facet');
var Selection = require('./selection');

// see discussion here: https://gist.github.com/gordonbrander/2230317
function uniqueID () {
  function chr4 () {
    return Math.random().toString(16).slice(-4);
  }
  return chr4() + chr4() +
    '-' + chr4() +
    '-' + chr4() +
    '-' + chr4() +
    '-' + chr4() + chr4() + chr4();
}

module.exports = Selection.extend({
  dataTypes: {
    // define datatypes to let ampersand do the (de)serializing
    facet: {
      set: function (newval) {
        // allow a facet to be null
        if (newval === null) {
          return {type: 'facet', val: null};
        }
        // set it from another facet by copying it
        if (newval && newval instanceof Facet) {
          var cpy = new Facet(newval.toJSON());
          cpy.dataset = newval.dataset;
          return {type: 'facet', val: cpy};
        }
        // set it from a JSON object
        try {
          newval = new Facet(newval);
          return {type: 'facet', val: newval};
        } catch (parseError) {
          return {type: typeof newval, val: newval};
        }
      },
      compare: function (currentVal, newVal, attributeName) {
        try {
          return currentVal.cid === newVal.cid;
        } catch (anyError) {
          return false;
        }
      }
    }
  },
  props: {
    chartType: ['string', true, 'filter'],
    /**
     * The primary facet is used to split the data into groups.
     * @memberof! Filter
     * @type {Facet}
     */
    primary: ['facet', false, null],

    /**
     * The secondary facet is used to split a group into subgroups; resulting in fi. a stacked barchart.
     * If not set, it falls back to a unit value
     * @memberof! Filter
     * @type {Facet}
     */
    secondary: ['facet', false, null],

    /**
     * The tertiary facet is used as group value (ie. it is summed, counted, or averaged etc.)
     * if not set, it falls back to the secondary, and then primary, facet.
     * @memberof! Filter
     * @type {Facet}
     */
    tertiary: ['facet', false, null],

    /**
     * Title for displaying purposes
     * @memberof! Filter
     * @type {string}
     */
    title: ['string', true, ''],

    /**
     * Unique ID for this widget
     * @memberof! Filter
     * @type {ID}
     */
    id: {
      type: 'number',
      default: function () {
        return uniqueID();
      },
      setonce: true
    }
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
     * A newdata event is fired when the data is ready to be plotted.
     * @function
     * @virtual
     * @memberof! Filter
     * @emits newdata
     */
    getData: {
      type: 'any',
      default: null
    }
  },

  // Initialize the Filter:
  // * set up callback to free internal state on remove
  initialize: function () {
    this.on('remove', this.releaseFilter, this);
  },

  /**
   * Set type, isLogScale, and categories for the selection based on
   * the properties of the primary facet
   * @memberof! Filter
   */
  initSelection: function () {
    this.reset();
    if (this.primary) {
      this.type = this.primary.displayType;
      this.isLogScale = this.primary.groupLog;
      this.categories = this.primary.categories;
    } else {
      this.type = 'categorial';
      this.isLogScale = false;
      this.categories = [];
    }
  }
});
