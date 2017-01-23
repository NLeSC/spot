var Dataset = require('../framework/dataset');
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
    var dataset = new Dataset(req.dataset);
    console.log(dataset.getId() + ': scanData');
    util.scanData(dataset);
  });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.dataset Serialized dataset
   * @params {string} req.filterId ID of the filter
   */
  socket.on('getMetaData', function (req) {
    var dataset = new Dataset(req.dataset);
    console.log(dataset.getId() + ': getMetaData');
    util.getMetaData(dataset);
  });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.dataset Serialized dataset
   * @params {string} req.filterId ID of the filter
   */
  socket.on('getData', function (req) {
    console.log(req.filterId + ': getData');
    var dataset = new Dataset(req.dataset);
    util.getData(dataset, dataset.filters.get(req.filterId));
  });


  /*
     * @function
     * @params {Object} req
     * @params {string} req.dataset Serialized dataset
     * @params {string} req.filterId ID of the filter
     */
    socket.on('getSQLDataSet', function (req) {
      console.log('spot-server.js: getSQLDataSet');
      util.searchSQLDataSet();
    });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.dataset Serialized dataset
   * @params {string} req.facetID of the facet
   */
  socket.on('setMinMax', function (req) {
    console.log(req.facetId + ': setMinMax');
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
    console.log(req.facetId + ': setCategories');
    var dataset = new Dataset(req.dataset);
    util.setCategories(dataset, dataset.facets.get(req.facetId));
  });

  /**
   * @function
   * @params {string} req.dataset Serialized dataset
   * @params {string} req.facetID of the facet
   */
  socket.on('setPercentiles', function (req) {
    console.log(req.facetId + ': setPercentiles');
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
    console.log(req.facetId + ': setExceedances');
    var dataset = new Dataset(req.dataset);
    util.setExceedances(dataset, dataset.facets.get(req.facetId));
  });

  socket.on('disconnect', function () {
    // we keep no track of connections, so nothing to be done here
    console.log('Client requests: disconnect');
  });
});
