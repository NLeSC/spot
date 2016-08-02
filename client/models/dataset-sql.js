// The PostgreSQL dataset, impelementing the Dataset interface
var Dataset = require('./dataset');
var socketIO = require('socket.io-client');

function setMinMax (dataset, facet, transformed) {
  // TODO
  console.warn('setMinMax() not implemented for sql datasets');
}

function setCategories (dataset, facet, transformed) {
  // TODO
  console.warn('setCategories() not implemented for sql datasets');
}

function setPercentiles (dataset, facet) {
  // TODO
  console.warn('setPercentiles() not implemented for sql datasets');
}

function setExceedances (dataset, facet) {
  // TODO
  console.warn('setExceedances() not implemented for sql datasets');
}

function scanData (dataset) {
  var socket = dataset.socket;

  console.log('spot-server: scanData');
  socket.emit('scanData');
}

function initDataFilter (dataset, filter) {
  var socket = dataset.socket;

  console.log('spot-server: sync-filters');
  socket.emit('sync-filters', dataset.filters.toJSON());

  socket.on('newdata-' + filter.getId(), function (data) {
    if (data) {
      filter.data = data;
      filter.trigger('newdata');
      console.log('spot-server: newdata-' + filter.getId());
    } else {
      console.error('No data in response to getdata for filter ' + filter.getId());
    }
  });

  var id = filter.getId();
  filter.getData = function () {
    console.log('spot-server: getdata for filter ' + id);
    socket.emit('getdata', id);
  };
}

function releaseDataFilter (dataset, filter) {
  var socket = dataset.socket;

  socket.off('newdata-' + filter.getId());
  socket.emit('sync-filters', dataset.filters.toJSON());
}

function updateDataFilter (dataset, filter) {
  var socket = dataset.socket;

  console.log('spot-server: sync-filters');
  socket.emit('sync-filters', dataset.filters.toJSON());
}

/**
 * Connect to the spot-server using a websocket on port 3080.
 * Setup callback for syncing dataset on 'sync-filters'.
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
    console.log('spot-server: disconnected, trying to reconnect');
    dataset.isConnected = false;
  });

  socket.on('sync-facets', function (data) {
    console.log('spot-server: sync-facets');
    dataset.facets.reset(data.facets);
    window.componentHandler.upgradeDom();
  });

  socket.on('sync-filters', function (data) {
    console.log('spot-server: sync-filters');
    dataset.filters.reset(data.filters);
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
      default: 'sql'
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
  socket: false,
  isConnected: false,

  connect: function () {
    console.log('Connection');
    connect(this);
  }
});
