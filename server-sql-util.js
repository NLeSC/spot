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
var io = require('./server-socket');
var squel = require('squel').useFlavour('postgres');
// var misval = require('./misval'); // not used yet

/*
 * Postgres connection and configuration:
 * 1. If pg-native is installed, will use the (faster) native bindings
 * 2. Find the optimal `poolSize` by running `SHOW max_connections` in postgres
 * 3. Database connection string and table name
 */
var pg = require('pg');
pg.defaults.poolSize = 75;

// TODO: make this configurable
var connectionString = 'postgres://jiska:postgres@localhost/jiska';
var databaseTable = 'buurt';

/* *****************************************************
 * SQL construction functions
 ******************************************************/

/**
 * Construct an expression for the 'WHERE' clause to filter invalid data
 * Data is considered valid if it is not equal to one of the `facet.misval`,
 * where 'null' is converted to `IS NOT NULL`
 * The type of the misval should match that of the facet.
 * @function
 * @params {Facet} facet
 * @return {Squel.expr} expression
 */
function whereValid (facet) {
  var accessor = facet.accessor;
  var query = squel.expr();

  facet.misval.forEach(function (val) {
    if (val === null) {
      query.and(accessor + ' IS NOT NULL');
    } else {
      if (facet.isCategorial) {
        var value = val;
        value = value.replace(/'/g, "''");

        // string valued facet
        query.and(accessor + " != '" + value + "'");
      } else if (facet.isContinuous) {
        // nummeric valued facet
        if ((val && val === +val) || val === 0) {
          // misval can be parsed as number
          query.and(accessor + ' != ' + (+val));
        } else {
          console.log('Non-nummeric missing value for isContinuous facet');
        }
      } else if (facet.isTimeOrDuration) {
        // TODO
        return '';
      } else {
        console.error('Invalid facet in whereValid', facet.toJSON());
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
function whereSelected (filter) {
  var where = squel.expr();
  if (!filter.primary || !filter.primary.accessor) {
    console.error('No primary facet for filter', filter.toString());
    return;
  }

  var accessor = filter.primary.accessor;

  if (filter.primary.displayCategorial) {
    // what groups are selected?
    var targetGroups = [];
    if (filter.primary.selected && filter.primary.selected.length > 0) {
      targetGroups = filter.primary.selected;
    } else {
      filter.primary.groups.forEach(function (group) {
        targetGroups.push(group.value);
      });
    }

    if (filter.primary.categorialTransform.length > 0) {
      var rules = {};

      // what rules gave those groups?
      targetGroups.forEach(function (group) {
        filter.primary.categorialTransform.forEach(function (rule) {
          // TODO / FIXME: the 'Other' group would be the negative of all rules...?
          // add the rule to our rule list
          rules[rule.expression] = true;
        });
      });

      // create where clause for each rule
      Object.keys(rules).forEach(function (rule) {
        var expression = rule;
        expression = expression.replace(/'/g, "''");

        if (expression.match('%')) {
          // regexp matching
          expression = " LIKE '" + expression + "'";
        } else {
          // direct comparison
          expression = " ='" + expression + "'";
        }
        where.or(accessor + expression);
      });
    } else {
      // no categorialTransfrom
      targetGroups.forEach(function (group) {
        // create where clause for each selected group
        var esc = group.replace(/'/g, "''");
        where.or(accessor + " = '" + esc + "'");
      });
    }
  } else if (filter.primary.displayContinuous) {
    if (filter.selected.length > 0) {
      where.and(accessor + '>=' + filter.selected[0]);
      where.and(accessor + '<=' + filter.selected[1]);
    } else {
      where.and(accessor + '>=' + filter.primary.minval);
      where.and(accessor + '<=' + filter.primary.maxval);
    }
  } else if (filter.primary.displayTime) {
    // time
    console.warn('TODO: filterWhereClaus not implemented yet');
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
function selectFieldContinuous (facet) {
  // TODO: Use width_bucket for Postgresql 9.5 or later
  // From the docs: return the bucket number to which operand would be assigned given an array listing
  // the lower bounds of the buckets; returns 0 for an input less than the first lower bound;
  // the thresholds array must be sorted, smallest first, or unexpected results will be obtained

  var lowerbounds = [];
  if (facet.continuousTransform.length > 0) {
    // apply continuousTransform
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
function selectFieldCategorial (facet) {
  // TODO / FIXME: the 'Other' group would be the negative of all rules...?

  var query = squel.case();
  var groupToIndex = {};
  var accessor = facet.accessor;

  // what groups/index are possible?
  facet.groups.forEach(function (group, i) {
    groupToIndex[group.value] = i + 1;
  });

  // what rules gave those groups?
  var rules = {};

  if (facet.categorialTransform.length > 0) {
    // for each selected group
    Object.keys(groupToIndex).forEach(function (group) {
      // check all rules
      facet.categorialTransform.forEach(function (rule) {
        // and add if relevant
        if (rule.group === group) {
          rules[rule.expression] = groupToIndex[group];
        }
      });
    });
  } else {
    // for each selected group
    Object.keys(groupToIndex).forEach(function (group) {
      // add a rule
      rules[group] = groupToIndex[group];
    });
  }

  // create WHEN clause for each rule
  Object.keys(rules).forEach(function (rule) {
    var expression = rule;
    expression = expression.replace(/'/g, "''");

    if (expression.match('%')) {
      // regexp matching
      expression = " LIKE '" + expression + "'";
    } else {
      // direct comparison
      expression = " ='" + expression + "'";
    }
    query.when(accessor + expression).then(rules[rule]);
  });
  query.else(0);

  return query;
}

/**
 * Create the SQL query part for a timeorduration facet
 * NOTE: data is labeled by group index
 *
 * @function
 * @params {Facet} facet an isTimeOrDuration facet
 * @returns {string} query
 */
function selectFieldTimeOrDuration (facet) {
  // TODO
}

/**
 * Create the SQL query part for a facet
 * @function
 * @params {Facet} facet
 * @returns {string} query
 */
function selectField (facet) {
  if (facet.isContinuous) {
    return selectFieldContinuous(facet);
  } else if (facet.isCategorial) {
    return selectFieldCategorial(facet);
  } else if (facet.isTimeOrDuration) {
    return selectFieldTimeOrDuration(facet);
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
  // NOTE: requiers at least postgres 9.4
  // select unnest(percentile_disc(array[0, 0.25, 0.5, 0.75]) within group (order by aant_inw)) from buurt
  // buurt where aant_inw != -99999998 and aant_inw != -99999997;

  facet.continuousTransform.reset();

  var p = [];
  var i;
  for (i = 0; i < 101; i++) {
    p[i] = i / 100;
  }
  var valid = whereValid(facet).toString();
  var query = 'SELECT unnest(percentile_cont(array[' + p.toString() + ']) WITHIN GROUP (ORDER BY ';
  query += facet.accessor + ')) FROM ' + databaseTable;
  if (valid.length > 0) {
    query += ' WHERE ' + valid;
  }

  queryAndCallBack(query, function (data) {
    data.rows.forEach(function (row, i) {
      var prevX = null;
      var nrules = facet.continuousTransform.length;
      if (nrules > 0) {
        prevX = facet.continuousTransform.models[nrules - 1].x;
      }

      var x = row.unnest;
      if (x === +x && x !== prevX) {
        facet.continuousTransform.add({
          x: x,
          fx: p[i] * 100
        });
      }
    });
    io.syncFacets(dataset);
  });
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
    var range = facet.continuousTransform.range();

    facet.minvalAsText = range[0].toString();
    facet.maxvalAsText = range[1].toString();

    if (facet.displayContinuous) {
      facet.setContinuousGroups();
    } else if (facet.displayTime) {
      facet.setTimeGroups();
    }
    io.syncFacets(dataset);
    return;
  }

  var query = squel.select()
    .from(databaseTable)
    .field('MIN(' + facet.accessor + ')', 'min')
    .field('MAX(' + facet.accessor + ')', 'max')
    .where(whereValid(facet).toString());

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
  var query;

  if (transformed) {
    facet.setCategorialGroups();
    io.syncFacets(dataset);
  } else {
    // use facet.accessor to select untransformed data,
    // add results to the facet's cateogorialTransform
    query = squel
      .select()
      .field(facet.accessor, 'value')
      .field('COUNT(*)', 'count')
      .where(whereValid(facet))
      .from(databaseTable)
      .group('value')
      .order('count', false)
.limit(50); // FIXME

    facet.groups.reset();
    queryAndCallBack(query, function (result) {
      var rows = result.rows;

      rows.forEach(function (row) {
        facet.categorialTransform.add({
          expression: row.value,
          count: parseFloat(row.count),
          group: row.value
        });
      });
      io.syncFacets(dataset);
    });
  }
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
  var query = squel.select().distinct().from(databaseTable).limit(50);

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
      // TODO: guess missing data indicators

      var sample = [];
      data.rows.forEach(function (row) {
        if (sample.length < 6 && sample.indexOf(row[field.name]) === -1) {
          sample.push(row[field.name]);
        }
      });

      dataset.facets.add({
        name: field.name,
        accessor: field.name,
        type: type,
        description: sample.join(', ')
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

  if (!facetA || !facetA.accessor || facetA.accessor.length === 0) facetA = new Facet({type: 'constant', accessor: '1'});
  if (!facetC || !facetC.accessor || facetC.accessor.length === 0) facetC = facetB;
  if (!facetC || !facetC.accessor || facetC.accessor.length === 0) facetC = facetA;
  if (!facetB || !facetB.accessor || facetB.accessor.length === 0) facetB = new Facet({type: 'constant', accessor: '1'});

  var query = squel
    .select()
    .field(selectField(facetA), 'a')
    .field(selectField(facetB), 'b')
    .field(facetC.reduction + '(' + facetC.accessor + ')', 'c')
    .where(whereValid(facetA))
    .where(whereValid(facetB))
    .where(whereValid(facetC))
    .from(databaseTable)
    .group('a')
    .group('b');

  // Apply selections from all other filters
  dataset.filters.forEach(function (w) {
    if (w.primary && w.primary.accessor && (w.getId() !== filter.getId())) {
      query.where(whereSelected(w));
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
      if (g > -1) {
        row.a = facetA.groups.models[g].value.toString();
      } else {
        row.a = null;
      }

      g = row.b > facetA.groups.length ? row.b - 2 : row.b - 1;
      if (g > -1) {
        row.b = facetB.groups.models[row.b - 1].value.toString();
      } else {
        row.b = null;
      }

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
