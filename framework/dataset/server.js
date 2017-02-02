/**
 * Implementation of a dataset backed by a server, which in turn uses fi. postgreSQL
 * Fully asynchronous, based on socketIO.
 *
 * Most methods below result in a message with the methodName and a data object, containing:
 *  * `dataset: dataset.toJSON()`
 *  * `facetId: facet.getId()`, or
 *  * `filterId: filter.getId()`
 *
 * Data can be requested by sending `getData` with dataset and filter ID, on which the server
 * responds with a `newData` message containing `filterId` and `data`.
 *
 * @module client/dataset-server
 */
var Dataset = require('../dataset');
var app = require('ampersand-app');

/**
 * Autoconfigure a dataset
 */
function scanData () {
  console.log('spot-server: scanData');
  app.me.socket.emit('scanData', {
    dataset: this.toJSON()
  });
}

/**
 * setMinMax sets the range of a continuous or time facet
 * @param {Facet} facet
 */
function setMinMax (facet) {
  console.log('spot-server: setMinMax');
  app.me.socket.emit('setMinMax', {
    dataset: this.toJSON(),
    facetId: facet.getId()
  });
}

/**
 * setCategories finds finds all values on an ordinal (categorial) axis
 * Updates the categorialTransform of the facet
 *
 * @param {Facet} facet
 */
function setCategories (facet) {
  console.log('spot-server: setCategories');
  facet.categorialTransform.rules.reset();
  app.me.socket.emit('setCategories', {
    dataset: this.toJSON(),
    facetId: facet.getId()
  });
}

/**
 * Calculate 100 percentiles (ie. 1,2,3,4 etc.), and initialize the `facet.continuousTransform`
 * @param {Facet} facet
 */
function setPercentiles (facet) {
  console.log('spot-server: setPercentiles' + facet.getId());
  app.me.socket.emit('setPercentiles', {
    dataset: this.toJSON(),
    facetId: facet.getId()
  });
}

/**
 * Initialize the data filter, and construct the getData callback function on the filter.
 * @param {Filter} filter
 */
function initDataFilter (filter) {
  var dataset = this;
  var id = filter.getId();

  filter.getData = function () {
    console.log('spot-server: getData for filter ' + id);
    app.me.socket.emit('getData', {
      dataset: dataset.toJSON(),
      filterId: id
    });
  };
}

/**
 * The opposite or initDataFilter, it should remove the filter and deallocate other configuration
 * related to the filter.
 * @param {Filter} filter
 */
function releaseDataFilter (filter) {
  filter.getData = function () {
    var data = [];
    filter.data = data;
  };
}

/**
 * Change the filter parameters for an initialized filter
 * @param {Filter} filter
 */
function updateDataFilter (filter) {
  // as the SQL server implementation is stateless, nothing to do here
}

function getAllData () {
  if (this.isPaused) {
    return;
  }
  console.log('spot-server: getAllData');
  app.me.socket.emit('getMetaData', {
    dataset: this.toJSON()
  });
  this.filters.forEach(function (filter, i) {
    if (filter.getData) {
      filter.getData();
    }
  });
}

module.exports = Dataset.extend({
  props: {
    datasetType: {
      type: 'string',
      setOnce: true,
      default: 'server'
    },
    /**
     * Database table name for server datasets, indicate table joins with a pipe: '|'
     * @memberof! Dataset
     * @type {string}
     */
    databaseTable: {
      type: 'string',
      default: ''
    }
  },

  /*
   * Implementation of virtual methods
   */
  scanData: scanData,
  setMinMax: setMinMax,
  setCategories: setCategories,
  setPercentiles: setPercentiles,
  initDataFilter: initDataFilter,
  releaseDataFilter: releaseDataFilter,
  updateDataFilter: updateDataFilter,
  getAllData: getAllData
});
