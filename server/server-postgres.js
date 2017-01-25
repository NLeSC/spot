/*
 * Postgres connection and configuration:
 * 1. If pg-native is installed, will use the (faster) native bindings
 * 2. Find the optimal `poolSize` by running `SHOW max_connections` in postgres
 * 3. Set database connection string and table name
 */
var pg = require('pg').native;
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
      done();

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
function setConnectionString (c) {
  pool = new pg.Pool({
    host: c
  });
}

module.exports = {
  queryAndCallBack: queryAndCallBack,
  setConnectionString: setConnectionString,
  SQLDatetimeTypes: SQLDatetimeTypes
};
