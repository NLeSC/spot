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
          var serialized = newval.toJSON();
          delete serialized.id;

          // we need a deep copy, but a new id for the facet. and we want the mixin of the dataset
          var cpy = new Facet(serialized);
          if (newval.collection && newval.collection.parent) {
            newval.collection.parent.extendFacet(newval.collection.parent, cpy);
          }
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
          return currentVal.id === newVal.id;
        } catch (anyError) {
          return false;
        }
      }
    }
  },
  props: {
    chartType: {
      type: 'string',
      required: true,
      default: 'barchart',
      values: ['piechart', 'barchart', 'linechart', 'radarchart', 'polarareachart', 'bubbleplot']
    },
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
    title: ['string', true, '']
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
    this.on('remove', function () {
      this.releaseDataFilter();
    }, this);
  },

  /**
   * Set type, isLogScale, and groups for the selection based on
   * the properties of the primary facet
   * @memberof! Filter
   */
  initSelection: function () {
    this.reset();
    if (this.primary) {
      this.type = this.primary.displayType;
      this.isLogScale = this.primary.groupLog; // FIXME: something for aggregate page setting?
      this.groups = this.primary.groups;
    } else {
      this.type = 'categorial';
      this.isLogScale = false;
    }
  }
});
