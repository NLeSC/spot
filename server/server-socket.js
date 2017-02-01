var io = require('socket.io')(3080);

/**
 * Send all Datasets from the server to the client
 */
function syncDatasets (datasets) {
  console.log('syncDatasets');
  io.emit('syncDatasets', datasets.toJSON());
}

/**
 * Send active Dataset from the server to the client
 */
function syncDataset (dataset) {
  console.log(dataset.getId() + ': syncDataset');
  io.emit('syncDataset', dataset.toJSON());
}

/**
 * Send Filters of active dataset from the server to the client
 */
function syncFilters (dataset) {
  console.log(dataset.getId() + ': syncFilters');
  io.emit('syncFilters', dataset.filters.toJSON());
}

/**
 * Send Facets of a dataset from the server to the client
 * { datasetId, facets.toJSON }
 */
function syncFacets (dataset) {
  console.log(dataset.getId() + ': syncFacets');
  io.emit('syncFacets', {
    datasetId: dataset.getId(),
    data: dataset.facets.toJSON()
  });
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

module.exports = {
  io: io,
  syncDatasets: syncDatasets,
  syncDataset: syncDataset,
  syncFilters: syncFilters,
  syncFacets: syncFacets,
  sendMetaData: sendMetaData,
  sendData: sendData
};
