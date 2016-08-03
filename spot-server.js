var Dataset = require('./client/models/dataset');
var util = require('./server-sql-util');
var wrappedio = require('./server-socket');

/*
 * Setup socket callback functions
 */
wrappedio.io.on('connection', function (socket) {
  console.log('Connecting to client');

  socket.on('scanData', function (req) {
    console.log('Client requests: scanData');
    var dataset = new Dataset(req.dataset);
    util.scanData(dataset);
  });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.filterId ID of the filter
   */
  socket.on('getData', function (req) {
    console.log('Client requests: getData', req);
    var dataset = new Dataset(req.dataset);
    util.getData(dataset, dataset.filters.get(req.filterId));
  });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.facetID of the facet
   * @params {boolean} req.transformed  Take min/max before (false) or after (true) transform
   */
  socket.on('setMinMax', function (req) {
    console.log('Client requests: setMinMax');
    var dataset = new Dataset(req.dataset);
    util.setMinMax(dataset, dataset.facets.get(req.facetId), req.transformed);
  });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.facetID of the facet
   * @params {boolean} req.transformed  Find categories before (false) or after (true) transform
   */
  socket.on('setCategories', function (req) {
    console.log('Client requests: setCategories');
    var dataset = new Dataset(req.dataset);
    util.setCategories(dataset, dataset.facets.get(req.facetId), req.transformed);
  });

  /**
   * @function
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
   * @params {string} req.facetID of the facet
   */
  socket.on('setExceedances', function (req) {
    console.log('Client requests: setExceedances');
    var dataset = new Dataset(req.dataset);
    util.setExceedances(dataset, dataset.facets.get(req.facetId));
  });

  socket.on('disconnect', function () {
    console.log('Client requests: disconnect');
    // TODO disconnect
  });
});
