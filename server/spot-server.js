var commandLineArgs = require('command-line-args');
var commandLineUsage = require('command-line-usage');
var Datasets = require('../framework/dataset/collection');
var Dataset = require('../framework/dataset');
var util = require('./server-sql-util');
var utilPg = require('./server-postgres');
var wrappedio = require('./server-socket');

var serverDatasets = new Datasets(); // TODO: read from disk or db

/**
 * Commanline options
 */
var optionDefinitions = [
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'print usage'
  },
  {
    name: 'connectionString',
    alias: 'c',
    type: String,
    description: 'database connection string'
  }
];

var usageSections = [
  {
    header: 'spot-server',
    content: 'Spot server'
  },
  {
    header: 'Options',
    optionList: optionDefinitions
  }
];

var options = commandLineArgs(optionDefinitions);

// Sanity check
// ************

// no commandline options, '-h', or '--help'
if (Object.keys(options).length === 0 || options.help) {
  console.log(commandLineUsage(usageSections));
  process.exit(0);
}

// no connection string
if (!options.connectionString) {
  console.error('Give connection string');
  process.exit(1);
}

utilPg.setConnectionString(options.connectionString);

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

  // Send Datasets to the client
  wrappedio.syncDatasets(serverDatasets);
});
