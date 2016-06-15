/**
 * Base widget
 *
 * @class Widget
 */

/**
 * newdata event
 * Indicates new data is available at widget.data for plotting.
 *
 * @event Widget#newdata
 */

/**
 * updatefacets event
 * Indicates one of the facets has changed.
 *
 * @event Widget#updatefacets
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

var AmpersandModel = require('ampersand-model');
var Facet = require('./facet');
var Selection = require('./selection');

// used as an unique id for each widget
var idCounter = 0;

module.exports = AmpersandModel.extend({
  dataTypes: {
    // define datatypes to let ampersand do the (de)serializing
    facet: {
      set: function (newval) {
        // allow a facet to be null
        if (newval === null) {
          return {type: 'facet', val: null};
        }
        // set it from another facet
        if (newval && newval instanceof Facet) {
          return {type: 'facet', val: newval};
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
  children: {
    /**
     * The Selection for this widget
     * @memberof! Widget
     * @type {Selection}
     */
    selection: Selection
  },
  props: {
    modelType: ['string', true, 'basewidget'],
    /**
     * Unique ID for this widget
     * @memberof! Widget
     * @type {ID}
     */
    id: {
      type: 'number',
      default: function () {
        return idCounter++;
      },
      setonce: true
    },
    /**
     * Title for displaying purposes
     * @memberof! Widget
     * @type {string}
     */
    title: ['string', true, ''],

    /**
     * The primary facet is used to split the data into groups.
     * @memberof! Widget
     * @type {Facet}
     */
    primary: ['facet', false, null],

    /**
     * The secondary facet is used to split a group into subgroups; resulting in fi. a stacked barchart.
     * If not set, it falls back to a unit value
     * @memberof! Widget
     * @type {Facet}
     */
    secondary: ['facet', false, null],

    /**
     * The tertiary facet is used as group value (ie. it is summed, counted, or averaged etc.)
     * if not set, it falls back to the secondary, and then primary, facet.
     * @memberof! Widget
     * @type {Facet}
     */
    tertiary: ['facet', false, null],

    /**
     * True if the widget accepts a primary facet
     * @abstract
     * @memberof! Widget
     * @type {boolean}
     */
    hasPrimary: ['boolean', true, true],

    /**
     * True if the widget accepts a secondary facet
     * @abstract
     * @memberof! Widget
     * @type {boolean}
     */
    hasSecondary: ['boolean', true, false],

    /**
     * True if the widget accepts a tertiary facet
     * @abstract
     * @memberof! Widget
     * @type {boolean}
     */
    hasTertiary: ['boolean', true, false]
  },

  // unique identifiers to hook up the mdl javascript
  derived: {
    _title_id: {
      deps: ['cid'],
      cache: true,
      fn: function () {
        return this.cid + '_title';
      }
    }
  },

  // Session properties are not typically persisted to the server,
  // and are not returned by calls to toJSON() or serialize().
  session: {
    /**
     * Array containing the data to plot
     * @memberof! Widget
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
     * The dataset backing the facet will copy the data to widget.data.
     * A newdata event is fired when the data is ready to be plotted.
     * @function
     * @memberof! Widget
     * @emits newdata
     */
    getData: {
      type: 'any',
      default: null
    },

    /**
     * Crossfilter dimension, only used for crossfilter datasets
     * @memberof! Widget
     */
    dimension: 'any'
  },

  // Initialize the widget:
  // * set up callback to free internal state on remove
  // * set up listeners for 'updatefacets'
  initialize: function () {
    this.on('remove', this.releaseFilter, this);
    this.on('updatefacets', function () {
      this.releaseFilter();
      this.initFilter();
    }, this);
  },

  /**
   * Initialize the filter
   * @function
   * @memberof! Widget
   */
  initFilter: function () {
    if (this.primary) {
      this.selection.reset();
      var dataset = this.primary.collection;
      dataset.initDataFilter(this);

      // Tell all widgets in collection to get new data
      if (this.collection) {
        this.collection.getAllData();
      }
    }
  },

  /**
   * Free the filter
   * Called automatically when widget is destroyed
   * @function
   * @memberof! Widget
   */
  releaseFilter: function () {
    var dataset = this.primary.collection;
    dataset.releaseDataFilter(this);
    this.selection.reset();

    // Tell all widgets in collection to get new data
    if (this.collection) {
      this.collection.getAllData();
    }
  },

  /**
   * Update the filter using the current widget.selection
   * @function
   * @memberof! Widget
   */
  updateFilter: function () {
    if (this.primary) {
      var dataset = this.primary.collection;
      dataset.updateDataFilter(this);

      // Tell all widgets in collection to get new data
      if (this.collection) {
        this.collection.getAllData();
      }
    }
  }
});
