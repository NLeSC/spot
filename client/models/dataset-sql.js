// The PostgreSQL dataset, impelementing the Dataset interface
var Dataset = require('./dataset');

function setMinMax (dataet, facet) {
  // TODO
  console.warn('setMinMax() not implemented for sql datasets');
}

function setCategories (dataset, facet) {
  // TODO
  console.warn('setCategories() not implemented for sql datasets');
}

function getPercentiles (dataset, facet) {
  // TODO
  console.warn('getPercentiles() not implemented for sql datasets');
}

function getExceedances (dataset, facet) {
  // TODO
  console.warn('getExceedances() not implemented for sql datasets');
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

module.exports = Dataset.extend({
  props: {
    datasetType: {
      type: 'string',
      setOnce: true,
      default: 'sql'
    }
  },
  initialize: function () {
    this.extend_facets(this, this.facets);
    this.extend_filters(this, this.filters);
  },

  /*
   * Implementation of virtual methods
   */
  scanData: scanData,
  setMinMax: setMinMax,
  setCategories: setCategories,
  getPercentiles: getPercentiles,
  getExceedances: getExceedances,

  initDataFilter: initDataFilter,
  releaseDataFilter: releaseDataFilter,
  updateDataFilter: updateDataFilter,

  // socketio for communicating with spot-server
  socket: false,
  isConnected: false
});
