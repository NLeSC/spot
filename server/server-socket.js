var io = require('socket.io')(3080);

/**
 * Send all Datasets from the server to the client
 */
function syncDatasets (datasets) {
  io.emit('syncDatasets', datasets.toJSON());
  console.timeEnd('getDatasets');
}

/**
 * Send active Dataset from the server to the client
 */
function syncDataset (dataset) {
  io.emit('syncDataset', dataset.toJSON());
  console.timeEnd(dataset.getId() + ': syncDataset');
}

/**
 * Send Filters of active dataset from the server to the client
 */
function syncFilters (dataset) {
  io.emit('syncFilters', dataset.filters.toJSON());
  console.timeEnd(dataset.getId() + ': syncFilters');
}

/**
 * Send Facets of a dataset from the server to the client
 * { datasetId, facets.toJSON }
 */
function syncFacets (dataset) {
  io.emit('syncFacets', {
    datasetId: dataset.getId(),
    data: dataset.facets.toJSON()
  });
  console.timeEnd(dataset.getId() + ': syncFacets');
}

/**
 * Send data from the server to the client
 * @params {Filter} filter
 * @params {Data} data
 */
function sendData (filter, data) {
  io.emit('newData', {
    filterId: filter.getId(),
    data: data
  });
  console.timeEnd(filter.getId() + ': getData');
}

/**
 * Send metadata from the server to the client
 * @params {Dataset} dataset
 * @params {number} total
 * @params {number} selected
 */
function sendMetaData (dataset, total, selected) {
  io.emit('newMetaData', {
    dataTotal: total,
    dataSelected: selected
  });
  console.timeEnd(dataset.getId() + ': getMetaData');
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
