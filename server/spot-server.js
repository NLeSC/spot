var commandLineArgs = require('command-line-args');
var commandLineUsage = require('command-line-usage');
var Datasets = require('../framework/dataset/collection');
var Dataset = require('../framework/dataset/server');
var util = require('./server-sql-util');
var utilPg = require('./server-postgres');
var wrappedio = require('./server-socket');
var fs = require('fs');

var serverDatasets;

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
  },
  {
    name: 'session',
    alias: 's',
    type: String,
    description: 'A saved session with configured datasets'
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

// Initialize
// **********

utilPg.setConnectionString(options.connectionString);

if (options.session) {
  var session = JSON.parse(fs.readFileSync(options.session, 'utf8'));
  serverDatasets = new Datasets(session.datasets);
} else {
  // TODO scan tables
  serverDatasets = new Datasets();
}

/*
 * Setup socket callback functions
 */
wrappedio.io.on('connection', function (socket) {
  console.log('Connecting to client');

  /**
   * @function
   */
  socket.on('getDatasets', function (req) {
    // Send Datasets to the client
    console.log('getDatasets');
    wrappedio.syncDatasets(serverDatasets);
  });

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

  socket.on('disconnect', function () {
    // we keep no track of connections, so nothing to be done here
    console.log('Client requests: disconnect');
  });
});
