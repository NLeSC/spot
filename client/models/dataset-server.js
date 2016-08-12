var Dataset = require('./dataset');
var socketIO = require('socket.io-client');

var app = require('ampersand-app');

function scanData (dataset) {
  console.log('spot-server: scanData');
  dataset.socket.emit('scanData', {
    dataset: dataset.toJSON()
  });
}

function setMinMax (dataset, facet) {
  console.log('spot-server: setMinMax');
  dataset.socket.emit('setMinMax', {
    dataset: dataset.toJSON(),
    facetId: facet.getId()
  });
}

function setCategories (dataset, facet) {
  console.log('spot-server: setCategories');
  dataset.socket.emit('setCategories', {
    dataset: dataset.toJSON(),
    facetId: facet.getId()
  });
}

function setPercentiles (dataset, facet) {
  console.log('spot-server: setPercentiles' + facet.getId());
  dataset.socket.emit('setPercentiles', {
    dataset: dataset.toJSON(),
    facetId: facet.getId()
  });
}

function setExceedances (dataset, facet) {
  console.log('spot-server: setExceedances' + facet.getId());
  dataset.socket.emit('setExceedances', {
    dataset: dataset.toJSON(),
    facetId: facet.getId()
  });
}

function initDataFilter (dataset, filter) {
  var socket = dataset.socket;

  console.log('spot-server: syncFilters');
  socket.emit('syncFilters', dataset.filters.toJSON());

  var id = filter.getId();
  filter.getData = function () {
    console.log('spot-server: getData for filter ' + id);
    socket.emit('getData', {
      dataset: dataset.toJSON(),
      filterId: id
    });
  };
}

function releaseDataFilter (dataset, filter) {
  var socket = dataset.socket;

  console.log('spot-server: syncFilters');
  socket.emit('syncFilters', dataset.filters.toJSON());

  filter.getData = function () {
    var data = [];
    filter.data = data;
  };
}

function updateDataFilter (dataset, filter) {
  var socket = dataset.socket;

  console.log('spot-server: syncFilters');
  socket.emit('syncFilters', dataset.filters.toJSON());
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

    console.log('spot-server: syncDataset');
    socket.emit('syncDataset', dataset.toJSON());
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
    } else {
      console.error('No data in response to getData for filter ' + filter.getId());
    }
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

  // socketio for communicating with spot-server
  isConnected: false,

  connect: function () {
    connect(this);
  }
});
