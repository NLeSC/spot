var io = require('socket.io')(3080);

/**
 * Send Dataset from the server to the client
 */
function syncDataset (dataset) {
  console.log(dataset.getId() + ': syncDataset');
  io.emit('syncDataset', dataset.toJSON());
}

/**
 * Send Filters from the server to the client
 */
function syncFilters (dataset) {
  console.log(dataset.getId() + ': syncFilters');
  io.emit('syncFilters', dataset.filters.toJSON());
}

/**
 * Send Facets from the server to the client
 */
function syncFacets (dataset) {
  console.log(dataset.getId() + ': syncFacets');
  io.emit('syncFacets', dataset.facets.toJSON());
}

/**
 * Send data from the server to the client
 * @params {Filter} filter
 * @params {Data} data
 */
function sendData (filter, data) {
  console.log(filter.getId() + ': newData');
  io.emit('newData', {
    filterId: filter.getId(),
    data: data
  });
}

/**
 * Send metadata from the server to the client
 * @params {Dataset} dataset
 * @params {number} total
 * @params {number} selected
 */
function sendMetaData (dataset, total, selected) {
  console.log(dataset.getId() + ': newMetaData');
  io.emit('newMetaData', {
    dataTotal: total,
    dataSelected: selected
  });
}

/**
 * Send dataset from the server to the client
 * @params {Data} data
 */
function sendSQLDataSet (data) {
  console.log('server-socket.js: sendSQLDataSet');
  io.emit('newSQLDataSet', data);
}


module.exports = {
  io: io,
  syncDataset: syncDataset,
  syncFilters: syncFilters,
  syncFacets: syncFacets,
  sendMetaData: sendMetaData,
  sendData: sendData,
  sendSQLDataSet: sendSQLDataSet
};
