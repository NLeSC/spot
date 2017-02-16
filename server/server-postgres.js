/*
 * Postgres connection and configuration:
 * 1. If pg-native is installed, will use the (faster) native bindings
 * 2. Find the optimal `poolSize` by running `SHOW max_connections` in postgres
 * 3. Set database connection string and table name
 */
var parseConnection = require('pg-connection-string').parse;

// The native bindings to libpq will give you some extra performance (~10%),
// but they cause issues with TravisCI
// The issues are probabaly fixable (install compilers and libpq etc.)
// but just using the non-native bindings is fine, too.
// var pg = require('pg').native;
var pg = require('pg');
var pool;

// Do not do any parsing for postgreSQL interval or datetime types
var types = require('pg').types;
var SQLDatetimeTypes = [1082, 1083, 1114, 1184, 1182, 1186, 1266];
SQLDatetimeTypes.forEach(function (type) {
  types.setTypeParser(type, function (val) { return val; });
});

/**
 * Perform an database query, and perform callback with the result
 * @function
 * @params{Squel.expr} q
 * @params{function} cb
 */
function queryAndCallBack (q, cb) {
  pool.connect(function (err, client, done) {
    if (err) {
      return console.error('error fetching client from pool', err);
    }

    client.query("set intervalstyle = 'iso_8601';" + q.toString(), function (err, result) {
      done(err);

      if (err) {
        return console.error('error running query', err);
      }
      cb(result);
    });
  });
}

/**
 * Connection settings
 * see for instance here:
 * https://jdbc.postgresql.org/documentation/80/connect.html
 * and securely setting password:
 * https://www.postgresql.org/docs/9.1/static/libpq-pgpass.html
 */
function setConnectionString (s) {
  c = parseConnection(s);

  console.log(c);
  pool = new pg.Pool(c);
  pool.on('error', function (err, client) {
    console.error('idle client error', err.message, err.stack);
  });
}

/**
 * Parse the result of a select(*) query, and create facets matching
 * the returned column names and types
 *
 * Identification of column (facet) type is done by querying the postgres metadata:
 * dataTypeID: 1700,         numeric
 * dataTypeID: 20, 21, 23,   integers
 * dataTypeID: 700, 701,     float8
 *
 * @param {array} data the result of a postgres query
 * @param {Dataset} dataset the dataset
 */
function parseRows (data, dataset) {
  // remove previous facets
  dataset.facets.reset();

  data.fields.forEach(function (field) {
    var type;
    var subtype;

    var SQLtype = field.dataTypeID;
    if (SQLtype === 1700 || SQLtype === 20 || SQLtype === 21 || SQLtype === 23 || SQLtype === 700 || SQLtype === 701) {
      type = 'continuous';
    } else if (SQLtype === 17) {
      // ignore:
      // 17: wkb_geometry
      console.warn('Ignoring column of type 17 (wkb_geometry)');
      return;
    } else if (SQLDatetimeTypes.indexOf(SQLtype) > -1) {
      // console.log('found: ', SQLtype);
      type = 'timeorduration';
      if (SQLtype === 1186) {
        subtype = 'duration';
      } else {
        subtype = 'datetime';
      }
    } else {
      // default to categorial
      // console.warn('Defaulting to categorial type for SQL column type ', SQLtype);
      type = 'categorial';
    }

    var sample = [];
    data.rows.forEach(function (row) {
      if (sample.length < 6 && sample.indexOf(row[field.name]) === -1) {
        sample.push(row[field.name]);
      }
    });

    var facet = dataset.facets.add({
      name: field.name,
      accessor: field.name,
      type: type,
      description: sample.join(', ')
    });
    if (facet.isTimeOrDuration) {
      facet.timeTransform.type = subtype;
    }
  });
}

module.exports = {
  parseRows: parseRows,
  queryAndCallBack: queryAndCallBack,
  setConnectionString: setConnectionString,
  SQLDatetimeTypes: SQLDatetimeTypes,
  disconnect: function () {
    pool.end();
  }
};
