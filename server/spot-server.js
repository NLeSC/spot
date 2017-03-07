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
    description: 'database connection string: postgres://user:password@host:port/table, where we fall back to user defaults (from the OS) when parts are unspecified'
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
  console.log('Serving datasets:', serverDatasets.length);
  serverDatasets.forEach(function (dataset, i) {
    console.log(i, dataset.name);
  });
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
    console.time('getDatasets');
    wrappedio.syncDatasets(serverDatasets);
  });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.dataset Serialized dataset
   */
  socket.on('scanData', function (req) {
    console.time(dataset.dataset.id + ': scanData');
    var dataset = new Dataset(req.dataset);
    util.scanData(dataset);
  });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.datasets Serialized datasets
   * @params {string} req.dataset Serialized dataset
   */
  socket.on('getMetaData', function (req) {
    console.time(req.filterId + ': getData');
    var datasets = new Datasets(req.datasets);
    var dataview = new Dataset(req.dataview);
    util.getMetaData(datasets, dataview);
  });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.datasets Serialized datasets
   * @params {string} req.dataview Serialized dataset
   */
  socket.on('getAllData', function (req) {
    console.log(req.filterId + ': getAllData');
    var datasets = new Datasets(req.datasets);
    var dataview = new Dataset(req.dataview);

    dataview.filters.forEach(function (filter) {
      console.time(filter.getId() + ': getData');
      util.getData(datasets, dataview, filter);
    });

    console.time(req.filterId + ': getData');
    util.getMetaData(datasets, dataview);
  });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.datasets Serialized datasets
   * @params {string} req.dataset Serialized dataset
   * @params {string} req.filterId ID of the filter
   */
  socket.on('getData', function (req) {
    console.time(req.filterId + ': getData');
    var datasets = new Datasets(req.datasets);
    var dataview = new Dataset(req.dataview);
    util.getData(datasets, dataview, dataview.filters.get(req.filterId));
  });

  /**
   * @function
   * @params {Object} req
   * @params {string} req.dataset Serialized dataset
   * @params {string} req.facetID of the facet
   */
  socket.on('setMinMax', function (req) {
    console.time(req.facetId + ': setMinMax');
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
    console.time(req.facetId + ': setCategories');
    var dataset = new Dataset(req.dataset);
    util.setCategories(dataset, dataset.facets.get(req.facetId));
  });

  /**
   * @function
   * @params {string} req.dataset Serialized dataset
   * @params {string} req.facetID of the facet
   */
  socket.on('setPercentiles', function (req) {
    console.time(req.facetId + ': setPercentiles');
    var dataset = new Dataset(req.dataset);
    util.setPercentiles(dataset, dataset.facets.get(req.facetId));
  });

  socket.on('disconnect', function () {
    // we keep no track of connections, so nothing to be done here
    console.log('Client requests: disconnect');
  });
});
