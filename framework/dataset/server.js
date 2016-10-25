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
var Dataset = require('./dataset');
var socketIO = require('socket.io-client');

var app = require('ampersand-app');

/**
 * Autoconfigure a dataset
 * @param {Dataset} dataset
 */
function scanData (dataset) {
  console.log('spot-server: scanData');
  dataset.socket.emit('scanData', {
    dataset: dataset.toJSON()
  });
}

/**
 * setMinMax sets the range of a continuous or time facet
 * @param {Dataset} dataset
 * @param {Facet} facet
 */
function setMinMax (dataset, facet) {
  console.log('spot-server: setMinMax');
  dataset.socket.emit('setMinMax', {
    dataset: dataset.toJSON(),
    facetId: facet.getId()
  });
}

/**
 * setCategories finds finds all values on an ordinal (categorial) axis
 * Updates the categorialTransform of the facet
 *
 * @param {Dataset} dataset
 * @param {Facet} facet
 */
function setCategories (dataset, facet) {
  console.log('spot-server: setCategories');
  facet.categorialTransform.rules.reset();
  dataset.socket.emit('setCategories', {
    dataset: dataset.toJSON(),
    facetId: facet.getId()
  });
}

/**
 * Calculate 100 percentiles (ie. 1,2,3,4 etc.), and initialize the `facet.continuousTransform`
 * @param {Dataset} dataset
 * @param {Facet} facet
 */
function setPercentiles (dataset, facet) {
  console.log('spot-server: setPercentiles' + facet.getId());
  dataset.socket.emit('setPercentiles', {
    dataset: dataset.toJSON(),
    facetId: facet.getId()
  });
}

/**
 * Calculate value where exceedance probability is one in 10,20,30,40,50,
 * Set the `facet.continuousTransform` to the approximate mapping.
 * @param {Dataset} dataset
 * @param {Facet} facet
 */
function setExceedances (dataset, facet) {
  console.log('spot-server: setExceedances' + facet.getId());
  dataset.socket.emit('setExceedances', {
    dataset: dataset.toJSON(),
    facetId: facet.getId()
  });
}

/**
 * Initialize the data filter, and construct the getData callback function on the filter.
 * @param {Dataset} dataset
 * @param {Filter} filter
 */
function initDataFilter (dataset, filter) {
  var socket = dataset.socket;

  var id = filter.getId();
  filter.getData = function () {
    console.log('spot-server: getData for filter ' + id);
    socket.emit('getData', {
      dataset: dataset.toJSON(),
      filterId: id
    });
  };
}

/**
 * The opposite or initDataFilter, it should remove the filter and deallocate other configuration
 * related to the filter.
 * @param {Dataset} dataset
 * @param {Filter} filter
 */
function releaseDataFilter (dataset, filter) {
  filter.getData = function () {
    var data = [];
    filter.data = data;
  };
}

/**
 * Change the filter parameters for an initialized filter
 * @param {Dataset} dataset
 * @param {Filter} filter
 */
function updateDataFilter (dataset, filter) {
  // as the SQL server implementation is stateless, nothing to do here
}

function getAllData (dataset) {
  if (dataset.isPaused) {
    return;
  }
  console.log('spot-server: getAllData');
  dataset.socket.emit('getMetaData', {
    dataset: dataset.toJSON()
  });
  dataset.filters.forEach(function (filter, i) {
    if (filter.getData) {
      filter.getData();
    }
  });
}

/**
 * Connect to the spot-server using a websocket on port 3080 and setup callbacks
 *
 * @function
 * @params {Dataset} dataset
 */
function connect (dataset) {
  var socket = socketIO('http://localhost:3080');

  socket.on('connect', function () {
    console.log('spot-server: connected');
    dataset.isConnected = true;
  });

  socket.on('disconnect', function () {
    console.log('spot-server: disconnected');
    dataset.isConnected = false;
  });

  socket.on('syncDataset', function (data) {
    console.log('spot-server: syncDataset');
    dataset.reset(data);
  });

  socket.on('syncFilters', function (data) {
    console.log('spot-server: syncFilters');
    dataset.filters.add(data, {merge: true});
  });

  socket.on('syncFacets', function (data) {
    console.log('spot-server: syncFacets');
    dataset.facets.add(data, {merge: true});

    // on the facets page, the list of facets needs upgrading
    if (app.currentPage.pageTitle === 'Facets') {
      window.componentHandler.upgradeDom();
    }

    // on the facet-define page, the minimum and maximum values are possibly updated,
    // but the input fields still need to be informed for the mld javascript to work
    if (app.currentPage.pageTitle === 'Facets - Edit') {
      app.currentPage.queryByHook('define-minimum-input').dispatchEvent(new window.Event('input'));
      app.currentPage.queryByHook('define-maximum-input').dispatchEvent(new window.Event('input'));
    }
  });

  socket.on('newData', function (req) {
    console.log('spot-server: newData ' + req.filterId);
    var filter = dataset.filters.get(req.filterId);
    if (req.data) {
      filter.data = req.data;
      filter.trigger('newData');
    }
  });

  socket.on('newMetaData', function (req) {
    console.log('spot-server: newMetaData');
    dataset.dataTotal = parseInt(req.dataTotal);
    dataset.dataSelected = parseInt(req.dataSelected);
  });

  console.log('spot-server: connecting');
  socket.connect();

  dataset.socket = socket;
}

module.exports = Dataset.extend({
  props: {
    datasetType: {
      type: 'string',
      setOnce: true,
      default: 'server'
    }
  },

  /*
   * Implementation of virtual methods
   */
  scanData: function () {
    scanData(this);
  },
  setMinMax: setMinMax,
  setCategories: setCategories,
  setPercentiles: setPercentiles,
  setExceedances: setExceedances,

  initDataFilter: initDataFilter,
  releaseDataFilter: releaseDataFilter,
  updateDataFilter: updateDataFilter,
  getAllData: getAllData,

  // socketio for communicating with spot-server
  isConnected: false,

  connect: function () {
    connect(this);
  }
});
