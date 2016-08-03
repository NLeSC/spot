/**
 * Utility functions for SQL datasets for use on the server
 *
 * Approach:
 * 1. The dataset, including Facets and Filters, is kept in sync with the client (website) using the 'syncFacet' requests
 * 2. An SQL view is created holding the transformed values of all active facets
 * 3. On a 'newData' request, construct a query using the relevant `Facet.groups`
 * 4, Execute the query, and send back the results
 *
 * @module client/util-sql
 */
var Facet = require('./client/models/facet');
// var misval = require('./misval'); // not used yet

// Websocket connection, wrapped with some extra functions
var io = require('./server-socket');

// Postgres connection, if pg-native is installed, will use the (faster) native bindings
var pg = require('pg');
pg.defaults.poolSize = 75; // Find this number by running `SHOW max_connections` in postgres
var squel = require('squel').useFlavour('postgres');

// TODO: make this configurable
var databaseTable = 'buurt';
var connectionString = 'postgres://jiska:postgres@localhost/jiska';

/* *****************************************************
 * SQL construction functions
 ******************************************************/

/**
 * Construct an expression for the 'WHERE' clause to filter invalid data
 * Data is considered valid if it is not equal to one of the `facet.misval`,
 * where 'null' is converted to `IS NOT NULL`
 * @function
 * @params {Facet} facet
 * @return {Squel.expr} expression
 */
function selectValid (facet) {
  var accessor = facet.accessor;
  var query = squel.expr();

  // TODO invalid data is fully ignored, should be set to misval
  facet.misval.forEach(function (val) {
    if (val === null) {
      query.and(accessor + ' IS NOT NULL');
    } else {
      if (facet.isCategorial) {
        // String valued facet
        query.and(accessor + " != '" + val + "'");
      } else if (facet.isContinuous) {
        // Number valued facet
        if ((val && val === +val) || val === 0) {
          query.and(accessor + ' != ' + val);
        }
      }
    }
  });
  return query;
}

/**
 * Construct an expression for the 'WHERE' clause to filter unselected data
 * @params {Filter} filter
 * @returns {Squel.expr} expression
 */
function filterWhereClause (filter) {
  var where = '';
  if (!filter.primary || !filter.primary.accessor) {
    console.error('No primary facet for filter', filter.toString());
  }

  var accessor = filter.primary.accessor;

  if (filter.selected.length > 0) {
    where = squel.expr();
    if (filter.primary.displayCategorial) {
      // categorial
      filter.selected.forEach(function (group) {
        where.and(accessor + ' = ' + group);
      });
    } else if (filter.primary.displayContinuous) {
      // continuous
      where.and(accessor + '>=' + filter.selected[0]);
      where.and(accessor + '<=' + filter.selected[1]);
    } else if (filter.primary.displayTime) {
      // time
      console.warn('TODO: filterWhereClaus not implemented yet');
    }
  }
  return where;
}

/**
 * Create the SQL query part for a Continuous facet
 * NOTE: data is labeled by group index
 *
 * @function
 * @params {Facet} facet an isContinuous facet
 * @returns {string} query
 */
function facetContinuousQuery (facet) {
  // TODO: Use width_bucket for Postgresql 9.5 or later
  // From the docs: return the bucket number to which operand would be assigned given an array listing
  // the lower bounds of the buckets; returns 0 for an input less than the first lower bound;
  // the thresholds array must be sorted, smallest first, or unexpected results will be obtained

  var lowerbounds = [];
  // check for continuousTransforms
  if (facet.continuousTransform.length > 0) {
    facet.groups.forEach(function (group, i) {
      lowerbounds[i] = facet.continuousTransform.inverse(group.min);
      lowerbounds[i + 1] = facet.continuousTransform.inverse(group.max);
    });
  } else {
    facet.groups.forEach(function (group, i) {
      lowerbounds[i] = group.min;
      lowerbounds[i + 1] = group.max;
    });
  }

  var accessor = facet.accessor;
  var query = squel.case();
  var b;

  var i;
  for (i = 0; i < lowerbounds.length - 1; i++) {
    b = squel.expr();
    b.and(accessor + '>' + lowerbounds[i]).and(accessor + '<=' + lowerbounds[i + 1]);
    query.when(b.toString()).then(i + 1);
  }
  query.else(lowerbounds.length);
  return query;
}

/**
 * Create the SQL query part for a categorial facet
 * NOTE: data is labeled by group index
 *
 * @function
 * @params {Facet} facet an isCategorial facet
 * @returns {string} query
 */
function facetCategorialQuery (facet) {
  // TODO
}

/**
 * Create the SQL query part for a timeorduration facet
 * NOTE: data is labeled by group index
 *
 * @function
 * @params {Facet} facet an isTimeOrDuration facet
 * @returns {string} query
 */
function facetTimeOrDurationQuery (facet) {
  // TODO
}

/**
 * Create the SQL query part for a facet
 * @function
 * @params {Facet} facet
 * @returns {string} query
 */
function facetQuery (facet) {
  if (facet.isContinuous) {
    return facetContinuousQuery(facet);
  } else if (facet.isCategorial) {
    return facetCategorialQuery(facet);
  } else if (facet.isTimeOrDuration) {
    return facetTimeOrDurationQuery(facet);
  }
  return '1'; // default to the first group
}

/* *****************************************************
 * Database communication functions
 ******************************************************/

/**
 * Perform an database query, and perform callback with the result
 * @function
 * @params{Squel.expr} q
 * @params{function} cb
 */
function queryAndCallBack (q, cb) {
  console.log('Connecting to ' + connectionString + ' and table ' + databaseTable);
  pg.connect(connectionString, function (err, client, done) {
    if (err) {
      return console.error('error fetching client from pool', err);
    }

    client.query(q.toString(), function (err, result) {
      console.log('Querying PostgreSQL:', q.toString());
      done();

      if (err) {
        return console.error('error running query', err);
      }
      cb(result);
    });
  });
}

/* *****************************************************
 * spot-server callbacks
 ******************************************************/

function setPercentiles (dataset, facet) {
  // TODO
  console.warn('setPercentiles() not implemented for sql datasets');
}

function setExceedances (dataset, facet) {
  // TODO
  console.warn('setExceedances() not implemented for sql datasets');
}

/**
 * Sets minimum and maximum value on a facet
 * NOTE: assumes continuousTransform is a monotonically increasing function
 * @function
 * @params {Dataset} Dataset
 * @params {Facet} facet
 * @params {boolean} transformed
 */
function setMinMax (dataset, facet, transformed) {
  // TODO kind === 'math'
  if (facet.kind === 'math') {
    console.error('Facet.kind === math not implenented for setMinMax sql datasets');
    return;
  }

  if (transformed && facet.continuousTransform.length > 0) {
    var range = facet.continuousTransform;

    facet.minvalAsText = range[0].toString();
    facet.maxvalAsText = range[1].toString();
  }

  var query = squel.select()
    .from(databaseTable)
    .field('MIN(' + facet.accessor + ')', 'min')
    .field('MAX(' + facet.accessor + ')', 'max')
    .where(selectValid(facet).toString());

  queryAndCallBack(query, function (result) {
    facet.minvalAsText = result.rows[0].min.toString();
    facet.maxvalAsText = result.rows[0].max.toString();

    // we do this here, to prevent synchronization issues where the client
    // updates the groups using wrong min/max,
    // but immediatetly gets overwritten by a sync from the server
    if (facet.displayContinuous) {
      facet.setContinuousGroups();
    } else if (facet.displayTime) {
      facet.setTimeGroups();
    }
    io.syncFacets(dataset);
  });
}

/**
 * setCategories finds finds all values on an ordinal (categorial) axis
 * Updates the categorialTransform or the Groups property of the facet
 *
 * @param {Dataset} dataset
 * @param {Facet} facet
 * @param {boolean} transformed Find categories after (true) or before (false) transformation
 */
function setCategories (dataset, facet, transformed) {
}

/**
 * Scan dataset and create Facets
 * when done, send new facets to client.
 *
 * Identification of column (facet) type is done by querying the postgres metadata
 * dataTypeID: 1700,         numeric
 * dataTypeID: 20, 21, 23,   integers
 * dataTypeID: 700, 701,     float8
 *
 * @function
 */
function scanData (dataset) {
  var query = squel.select().from(databaseTable).limit(1);

  queryAndCallBack(query, function (data) {
    // remove previous facets
    dataset.facets.reset();

    data.fields.forEach(function (field) {
      var type;
      var SQLtype = field.dataTypeID;
      if (SQLtype === 1700 || SQLtype === 20 || SQLtype === 21 || SQLtype === 23 || SQLtype === 700 || SQLtype === 701) {
        type = 'continuous';
      } else {
        type = 'categorial';
      }
      //  TODO: guess missing data indicators

      dataset.facets.add({
        name: field.name,
        accessor: field.name,
        type: type,
        description: 'Automatically detected facet, please check configuration' // TODO fill with sampled data
      });
    });

    // send facets to client
    io.syncFacets(dataset);
  });
}

/**
 * Get data for a filter
 * @params {Dataset} dataset
 * @params {Filter} filter
 */
function getData (dataset, filter) {
  var facetA = filter.primary;
  var facetB = filter.secondary;
  var facetC = filter.tertiary;

  if (!facetA) facetA = new Facet({type: 'constant'});
  if (!facetC) facetC = facetB;
  if (!facetC) facetC = facetA;
  if (!facetB) facetB = new Facet({type: 'constant'});

  var query = squel
    .select()
    .from(databaseTable)
    .field(facetQuery(facetA).toString(), 'a')
    .field(facetQuery(facetB).toString(), 'b')
    .field(facetC.reduction + '(' + facetC.accessor + ')', 'c')
    .where(selectValid(facetA).toString())
    .where(selectValid(facetB).toString())
    .where(selectValid(facetC).toString())
    .group('a')
    .group('b');

  // Apply selections from all other filters
  dataset.filters.forEach(function (w) {
    if (w.getId() !== filter.getId()) {
      query.where(filterWhereClause(w));
    }
  });

  queryAndCallBack(query, function (result) {
    // Post process
    var rows = result.rows;

    // sum groups to calculate relative values
    var fullTotal = 0;
    var groupTotals = {};
    rows.forEach(function (row) {
      row.c = parseFloat(row.c);
      groupTotals[row.a] = groupTotals[row.a] || 0;
      groupTotals[row.a] += row.c;
      fullTotal += row.c;
    });

    // Re-format the data
    rows.forEach(function (row) {
      // Replace base-1 group index with label
      var g;
      g = row.a > facetA.groups.length ? row.a - 2 : row.a - 1;
      row.a = facetA.groups.models[g].value.toString();

      g = row.b > facetA.groups.length ? row.b - 2 : row.b - 1;
      row.b = facetB.groups.models[row.b - 1].value.toString();

      // Postprocess
      if (facetC.reducePercentage) {
        if (filter.secondary) {
          // we have subgroups, normalize wrt. the subgroup
          row.c = 100.0 * row.c / groupTotals[row.a];
        } else {
          // no subgroups, normalize wrt. the full total
          row.c = 100.0 * row.c / fullTotal;
        } }
    });
    io.sendData(filter, rows);
  });
}

module.exports = {
  scanData: scanData,
  getData: getData,
  setMinMax: setMinMax,
  setCategories: setCategories,
  setPercentiles: setPercentiles,
  setExceedances: setExceedances
};
