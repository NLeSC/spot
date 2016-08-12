/**
 * A Dataset is responsible for actually managing the data: based on the filters and their factes,
 * implement callbacks that return the processed data in a standardized format.
 *
 * To help analyze data, a few methods to help autoconfigure your session must be implemented.
 *
 * Implementations for Crossfilter (fully in memory client side filtering) and PostgreSQL datasets are available.
 * @class Dataset
 */

var AmpersandModel = require('ampersand-model');
var Filters = require('./filter-collection');
var Facets = require('./facet-collection');

/*
 * Add implementation of (dataset specific) virutal functions to a facet
 */
function extendFacet (dataset, facet) {
  facet.setMinMax = function (transformed) {
    dataset.setMinMax(dataset, facet, transformed);
  };

  facet.sampleDataset = function (N) {
    return dataset.sampleDataset(dataset, N);
  };

  facet.setCategories = function () {
    dataset.setCategories(dataset, facet);
  };

  facet.setPercentiles = function () {
    dataset.setPercentiles(dataset, facet);
  };

  facet.setExceedances = function () {
    dataset.setExceedances(dataset, facet);
  };
}

/*
 * Add implementation of (dataset specific) virutal functions to a filter
 */
function extendFilter (dataset, filter) {
  filter.initDataFilter = function () {
    dataset.releaseDataFilter(dataset, filter);
    dataset.initDataFilter(dataset, filter);
    dataset.updateDataFilter(dataset, filter);
    filter.reset();
    filter.trigger('newFacets');
    dataset.getAllData(dataset);
  };
  filter.releaseDataFilter = function () {
    dataset.releaseDataFilter(dataset, filter);
    filter.clear();
    filter.trigger('newFacets');
    dataset.getAllData(dataset);
  };
  filter.updateDataFilter = function () {
    dataset.updateDataFilter(dataset, filter);
    dataset.getAllData(dataset);
  };
}

/*
 * Add implementation of (dataset specific) virutal functions to all facets
 */
function extendFacets (dataset) {
  dataset.facets.forEach(function (facet) {
    extendFacet(dataset, facet);
  });
}

/*
 * Add implementation of (dataset specific) virutal functions to all filters
 */
function extendFilters (dataset) {
  dataset.filters.forEach(function (filter) {
    extendFilter(dataset, filter);
  });
}

/*
 * Stubs for virtual functions
 */
function setPercentiles (dataset, facet) {
  console.error('Virtual method setPercentiles');
}

function setExceedances (dataset, facet) {
  console.error('Virtual method setExceedances');
}

function sampleDataset (dataset, N) {
  console.error('Virtual method sampleDataset');
}

function setMinMax (dataset, facet) {
  console.error('Virtual method setMinMax');
}

function setCategories (dataset, facet, transformed) {
  console.error('Virtual method setCategories');
}

function scanData () {
  console.error('Virtual method scanData');
}

function initDataFilter (filter) {
  console.error('Virtual method initDataFilter');
}

function releaseDataFilter (filter) {
  console.error('Virtual method releaseDataFilter');
}

function updateDataFilter (filter) {
  console.error('Virtual method updateDataFilter');
}

function getAllData (dataset) {
  if (dataset.isPaused) {
    return;
  }
  dataset.filters.forEach(function (filter, i) {
    if (filter.getData) {
      filter.getData();
    }
  });
}

module.exports = AmpersandModel.extend({
  props: {
    /**
     * Type of the dataset: crossfilter, server, generic (none)
     * @memberof! Dataset
     * @readonly
     * @type {string}
     */
    datasetType: {
      type: 'string',
      setOnce: true,
      values: ['client', 'server', 'generic'],
      default: 'generic'
    }
  },
  session: {
    /**
     * isPaused when true, calls to getAllData are ignored.
     * This is useful to suppres calls to getData
     * when adding and removing a number of filters at once.
     * @memberof! Dataset
     * @type {boolean}
     */
    isPaused: ['boolean', false, true]
  },
  initialize: function () {
    this.extendFacets(this);
    this.facets.on('add reset', function () {
      extendFacets(this);
    }, this);

    this.extendFilters(this);
    this.filters.on('add reset', function (filter, filters, options) {
      extendFilters(this);
    }, this);
  },
  collections: {
    /**
     * A Filter collection holding all active filters on the dataset
     * @memberof! Dataset
     * @type {Filter[]}
     */
    filters: Filters,
    /**
     * A Facet collection holding pre defined facets
     * @memberof! Dataset
     * @type {Facet[]}
     */
    facets: Facets
  },

  /**
   * Pause the dataset. This means calls to getData are blocked.
   * Useful when updating a lot of filters and you are not interested in the intermediate state.
   * @memberof Dataset
   */
  pause: function () {
    this.isPaused = true;
  },
  /**
   * Unpause the dataset
   * @memberof Dataset
   */
  play: function () {
    this.isPaused = false;
  },

  /**
   * getAllData
   * Refresh data for all filters, by calling getData for each filter in the filter collection.
   * @see pause and play
   * @memberof! Dataset
   * @function
   */
  getAllData: getAllData,

  /**
   * Autoconfigure a dataset:
   * 1. inspect the dataset, and create facets for the properties
   * 2. for continuous facets, guess the missing values, and set the minimum and maximum values
   * 3. for categorial facets, set the categorialTransform
   *
   * @memberof! Dataset
   * @function
   */
  scanData: scanData,

  /**
   * returns an array containing N datum objects
   * @memberof! Dataset
   * @param {number} N Number of objects to return
   * @virtual
   * @function
   * @returns {Object[]} data Array of objects
   */
  sampleDataset: sampleDataset,

  /**
   * setMinMax finds the range of a continuous facet,
   * @memberof! Facet
   * @virtual
   * @function
   */
  setMinMax: setMinMax,

  /**
   * setCategories finds finds all values on an ordinal (categorial) axis.
   * Updates the categorialTransform property of the facet
   *
   * @memberof! Facet
   * @virtual
   * @function
   */
  setCategories: setCategories,

  /**
   * Calculate 100 percentiles (ie. 1,2,3,4 etc.)
   * Use the recommended method from [NIST](http://www.itl.nist.gov/div898/handbook/prc/section2/prc262.htm)
   * See also the discussion on [Wikipedia](https://en.wikipedia.org/wiki/Percentile)
   *
   * @memberof! Facet
   * @virtual
   * @function
   */
  setPercentiles: setPercentiles,

  /**
   * Calculate value where exceedance probability is one in 10,20,30,40,50,
   * and the same for -exceedance -50, -60, -70, -80, -90, -99, -99.9, -99.99, ... percent
   * Approximate from data: 1 in 10 is larger than value at index trunc(0.1 * len(data))
   *
   * @memberof! Facet
   * @virtual
   * @function
   */
  setExceedances: setExceedances,

  /**
   * initDataFilter
   * Initialize the data filter, and construct the getData callback function on the filter.
   * @memberof! Filter
   * @function
   * @virtual
   */
  initDataFilter: initDataFilter,

  /**
   * relaseDataFilter
   * The opposite or initDataFilter, it should remove the filter and deallocate
   * other data related to the filter.
   * @memberof! Filter
   * @function
   * @virtual
   */
  releaseDataFilter: releaseDataFilter,

  /**
   * updateDataFilter
   * Change the filter parameters for an initialized filter
   * @memberof! Filter
   * @function
   * @virtual
   */
  updateDataFilter: updateDataFilter,

  /**
   * Extends a Facet by adding the dataset dependent callback functions:
   * `setMinMax`, `setCategories`, `setExceedances`, and `setPercentiles`
   * Automatically called when adding facets to the dataset
   * @memberof! Dataset
   * @function
   * @param {Dataset} dataset
   * @param {Facet} facet
   */
  extendFacet: extendFacet,
  extendFacets: extendFacets,

  /**
   * Extends a Filter by adding the dataset dependent callback functions:
   * `initDataFilter`, `updateDataFilter`, and `releaseDataFilter`
   * Automatically called when adding filters to the dataset
   * @memberof! Dataset
   * @function
   * @param {Dataset} dataset
   * @param {Filter} filter
   */
  extendFilter: extendFilter,
  extendFilters: extendFilters
});
