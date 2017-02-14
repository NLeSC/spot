var commandLineArgs = require('command-line-args');
var commandLineUsage = require('command-line-usage');
var pg = require('pg'); // .native not supported
var pgStream = require('pg-copy-streams');
var client = new pg.Client();
var fs = require('fs');
var csvParse = require('csv-parse/lib/sync');
var csvStringify = require('csv-stringify');

var squel = require('squel').useFlavour('postgres');
squel.create = require('./squel-create');

var Me = require('../framework/me');
var CrossfilterDataset = require('../framework/dataset/client');
var misval = require('../framework/util/misval');

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
  },
  {
    name: 'session',
    alias: 's',
    type: String,
    description: 'A saved session with configured datasets'
  },
  {
    name: 'url',
    alias: 'u',
    type: String,
    description: 'Dataset URL'
  },
  {
    name: 'description',
    alias: 'd',
    type: String,
    description: 'Dataset description'
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
var dataset = new CrossfilterDataset({
  name: options.file,
  description: options.description,
  URL: options.url
});

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
var columns = [];
var q = squel.create().table(options.table);

// TODO: optionally, read from session file
dataset.scanData();
dataset.facets.forEach(function (facet) {
  facet.isActive = true;
  if (facet.isCategorial) {
    facet.setCategories();
    q.field(facet.name, 'varchar');
  } else if (facet.isContinuous) {
    facet.setMinMax();
    q.field(facet.name, 'real');
  } else if (facet.isTimeOrDuration) {
    facet.setMinMax();
    if (facet.timeTransform.isDatetime) {
      q.field(facet.name, 'timestamp with time zone');
    } else if (facet.timeTransform.isDuration) {
      q.field(facet.name, 'interval');
    } else {
      console.error('Unhandled facet');
      process.exit(7);
    }
  }
  columns.push(facet.name);
});

// Have the spot framework parse the data
var me = new Me();
me.datasets.add(dataset);
me.toggleDataset(dataset);
var parsed = me.dataview.exportData();

// Create database table
// *********************

client.on('drain', client.end.bind(client));
client.connect(function (err) {
  if (err) throw err;

  // setup copy from
  var command = 'COPY ' + options.table + ' FROM STDIN ';
  command = command + '( ';
  command = command + 'FORMAT CSV, ';
  command = command + "DELIMITER '\t', ";
  command = command + 'NULL ' + misval + ' ';
  command = command + ') ';

  // create table & sink
  client.query('DROP TABLE IF EXISTS ' + options.table);
  client.query(q.toString());
  var sink = client.query(pgStream.from(command));

  // create source
  var source = csvStringify({
    columns: columns,
    quote: false,
    quotedEmpty: false,
    delimiter: '\t',
    rowDelimiter: 'unix'
  });

  source.pipe(sink);
  parsed.forEach(function (row) {
    source.write(row);
  });
  source.end();
});

// Update session file
// *******************
if (options.session) {
  try {
    contents = fs.readFileSync(options.session, 'utf8');
    var session = JSON.parse(contents);
    me = new Me(session);
  } catch (err) {
    // console.error(err);
  }

  try {
    var json = dataset.toJSON();
    json.databaseTable = options.table;
    json.datasetType = 'server';

    me.datasets.add(json);
    fs.writeFileSync(options.session, JSON.stringify(me.toJSON()));
  } catch (err) {
    console.error(err);
    process.exit(9);
  }
}
