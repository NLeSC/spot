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

// no file to import
if (options.file) {
  if (!(options.csv || options.json)) {
    console.error('Give either CSV or JSON filetype');
    process.exit(2);
  }
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

// *********************
// Do import
// *********************
var dataset;
if (options.file) {
  dataset = importFile(options);
} else {
  dataset = scanTable(options);
}

/**
 * Scan an existing database table
 * @param {hash} options
 * @returns {Dataset} dataset
 */
function scanTable (options) {
}

/**
 * Load data form a file
 * @param {hash} options
 * @returns {Dataset} dataset
 */
function importFile (options) {
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
      console.log(contents[0]);
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

  console.log('Scanning');
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
    } else if (facet.isText) {
      q.field(facet.name, 'varchar');
    }
    columns.push(facet.name);
  });

  // Have the framework parse the data once
  // needed to ignore missing / invalid data that would abort the import
  // when adding to the database
  console.log('Validating');
  var crossfilterMe = new Me();
  crossfilterMe.datasets.add(dataset);
  crossfilterMe.toggleDataset(dataset);
  var parsed = crossfilterMe.dataview.exportData();

  // Create database table
  // *********************
  console.log('Streaming to database');
  client.on('drain', client.end.bind(client));
  client.connect(function (err) {
    if (err) throw err;

    // setup copy from
    var command = 'COPY ' + options.table + ' FROM STDIN ';
    command = command + '( ';
    command = command + 'FORMAT CSV, ';
    command = command + "DELIMITER '\t', ";
    command = command + "QUOTE '\b', "; // defaults to '"' which can give problems
    command = command + 'NULL ' + misval + ' ';
    command = command + ') ';
    console.log(command.toString());

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
    // var testSink = fs.createWriteStream('file_to_import.csv');
    // source.pipe(testSink);

    var counter = 0;
    parsed.forEach(function (row) {
      source.write(row);
      counter += 1;
      console.log(counter);
    });
    source.end();
    sink.end();
  });

  return crossfilterMe.datasets.remove(dataset);
}

// Update session file
// *******************

// Load current config
var me;
var contents;
if (options.session) {
  try {
    contents = JSON.parse(fs.readFileSync(options.session, 'utf8'));
    me = new Me(contents);
  } catch (err) {
    // console.error(err);
    console.log('Failed to load session, creating new session file');
    me = new Me();
  }
}

if (options.session) {
  // add new dataset
  var json = dataset.toJSON();
  json.datasetType = 'server';
  json.databaseTable = options.table;
  me.datasets.add(json);

  // cleanup and force config
  delete me.dataview;
  me.datasets.forEach(function (dataset) {
    dataset.isActive = false;
  });

  // write
  fs.writeFileSync(options.session, JSON.stringify(me.toJSON()));
}
