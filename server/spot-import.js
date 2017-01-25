var commandLineArgs = require('command-line-args');
var commandLineUsage = require('command-line-usage');
var fs = require('fs');
var csvParse = require('csv-parse/lib/sync');
var util = require('./server-postgres');

var squel = require('squel').useFlavour('postgres');
squel.create = require('./squel-create');

var CrossfilterDataset = require('../framework/dataset/client');

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
    name: 'file',
    alias: 'f',
    type: String,
    description: 'File to import'
  },
  {
    name: 'csv',
    type: Boolean,
    description: 'File is in CSV format'
  },
  {
    name: 'json',
    type: Boolean,
    description: 'File is in JSON format'
  },
  {
    name: 'table',
    type: String,
    description: 'Table name'
  }
];

var usageSections = [
  {
    header: 'spot-import',
    content: 'Imports a CSV or JSON file to a SQL database and updates the metadata table'
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

// contradictory file formats
if (options.csv && options.json) {
  console.error('Give either CSV or JSON options, not both');
  process.exit(1);
}

// no file format
if (!(options.csv || options.json)) {
  console.error('Give either CSV or JSON');
  process.exit(2);
}

// no file to import
if (!options.file) {
  console.error('Give filename');
  process.exit(3);
}

// no connection string
if (!options.connectionString) {
  console.error('Give connection string');
  process.exit(4);
}

// no table name
if (!options.table) {
  // TODO check if name is valid
  console.error('Give table name');
  process.exit(5);
}

// Load the data
// *************

// create dataset structure
// TODO: add metadata
var dataset = new CrossfilterDataset({ });

// load file
var contents;
try {
  contents = fs.readFileSync(options.file, 'utf8');
} catch (err) {
  console.log(err);
  console.error('Cannot read file', options.file);
  process.exit(6);
}

// parse
var data;
if (options.json) {
  data = JSON.parse(contents);
} else if (options.csv) {
  // remove leading '#' from first line, if present
  if (contents[0] === '#') {
    contents[0] = ' ';
  }

  data = csvParse(contents, {
    columns: true
  });
}

// add to dataset
dataset.crossfilter.add(data);

// Scan and configure
// ******************

// TODO: optionally, read from session file
dataset.scanData();
dataset.facets.forEach(function (facet) {
  if (facet.isCategorial) {
    facet.setCategories();
  } else if (facet.isContinuous) {
    facet.setMinMax();
  } else if (facet.isTimeOrDuration) {
    facet.setMinMax();
  }
});

// Create database table
// *********************

util.setConnectionString(options.connectionString);
var q = squel.create().table(options.table);

util.queryAndCallBack(q, function () {
  console.log('Creating table');
});

console.log('done');
process.exit(0);
