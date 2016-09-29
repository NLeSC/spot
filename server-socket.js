var io = require('socket.io')(3080);

/**
 * Send Dataset from the server to the client
 */
function syncDataset (dataset) {
  console.log('server pushes: syncDataset');
  io.emit('syncDataset', dataset.toJSON());
}

/**
 * Send Filters from the server to the client
 */
function syncFilters (dataset) {
  console.log('server pushes: syncFilters');
  io.emit('syncFilters', dataset.filters.toJSON());
}

/**
 * Send Facets from the server to the client
 */
function syncFacets (dataset) {
  console.log('server pushes: syncFacets');
  io.emit('syncFacets', dataset.facets.toJSON());
}

/**
 * Send data from the server to the client
 * @params {Filter} filter
 * @params {Data} data
 */
function sendData (filter, data) {
  console.log('server pushes: newData');
  io.emit('newData', {
    filterId: filter.getId(),
    data: data
  });
}

/**
 * Send metadata from the server to the client
 * @params {number} total
 * @params {number} selected
 */
function sendMetaData (total, selected) {
  console.log('server pushes metadata');
  io.emit('newMetaData', {
    dataTotal: total,
    dataSelected: selected
  });
}

module.exports = {
  io: io,
  syncDataset: syncDataset,
  syncFilters: syncFilters,
  syncFacets: syncFacets,
  sendMetaData: sendMetaData,
  sendData: sendData
};
