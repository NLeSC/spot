var Dataset = require('./client/models/dataset');
var util = require('./server-sql-util');
var wrappedio = require('./server-socket');

/*
 * Setup socket callback functions
 */
wrappedio.io.on('connection', function (socket) {
  console.log('Connecting to client');

  /**
   * @function
   * @params {Object} req
   * @params {string} req.dataset Serialized dataset
   */
  socket.on('scanData', function (req) {
    console.log('Client requests: scanData');
    var dataset = new Dataset(req.dataset);
    util.scanData(dataset);
  });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.dataset Serialized dataset
   * @params {string} req.filterId ID of the filter
   */
  socket.on('getMetaData', function (req) {
    console.log('Client requests: getMetaData');
    var dataset = new Dataset(req.dataset);
    util.getMetaData(dataset);
  });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.dataset Serialized dataset
   * @params {string} req.filterId ID of the filter
   */
  socket.on('getData', function (req) {
    console.log('Client requests: getData');
    var dataset = new Dataset(req.dataset);
    util.getData(dataset, dataset.filters.get(req.filterId));
  });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.dataset Serialized dataset
   */
  socket.on('getMetaData', function (req) {
    console.log('Client requests: getMetaData');
    var dataset = new Dataset(req.dataset);
    util.getMetaData(dataset);
  });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.dataset Serialized dataset
   * @params {string} req.facetID of the facet
   */
  socket.on('setMinMax', function (req) {
    console.log('Client requests: setMinMax');
    var dataset = new Dataset(req.dataset);
    util.setMinMax(dataset, dataset.facets.get(req.facetId));
  });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.dataset Serialized dataset
   * @params {string} req.facetID of the facet
   */
  socket.on('setCategories', function (req) {
    console.log('Client requests: setCategories');
    var dataset = new Dataset(req.dataset);
    util.setCategories(dataset, dataset.facets.get(req.facetId));
  });

  /**
   * @function
   * @params {string} req.dataset Serialized dataset
   * @params {string} req.facetID of the facet
   */
  socket.on('setPercentiles', function (req) {
    console.log('Client requests: setPercentiles');
    var dataset = new Dataset(req.dataset);
    util.setPercentiles(dataset, dataset.facets.get(req.facetId));
  });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.dataset Serialized dataset
   * @params {string} req.facetID of the facet
   */
  socket.on('setExceedances', function (req) {
    console.log('Client requests: setExceedances');
    var dataset = new Dataset(req.dataset);
    util.setExceedances(dataset, dataset.facets.get(req.facetId));
  });

  socket.on('disconnect', function () {
    // we keep no track of connections, so nothing to be done here
    console.log('Client requests: disconnect');
  });
});
