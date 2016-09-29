/**
 * Utility functions for SQL datasets for use on the server
 *
 *  SELECT
 *    each filter.partition
 *    each filter.aggregate
 *  FROM
 *    table
 *  WHERE
 *    whereValid for each facet linked to current filters
 *    whereSelected for each partition of each filter
 *  GROUP BY
 *    each partition
 *
 * select extract(hour from timestamp with time zone '1978-10-20 12:04:004');
 * @module client/util-sql
 */
var io = require('./server-socket');
var squel = require('squel').useFlavour('postgres');
var moment = require('moment-timezone');
var utilTime = require('./client/util-time');
/*
 * Postgres connection and configuration:
 * 1. If pg-native is installed, will use the (faster) native bindings
 * 2. Find the optimal `poolSize` by running `SHOW max_connections` in postgres
 * 3. Set database connection string and table name
 */
var pg = require('pg').native;
pg.defaults.poolSize = 75;

// TODO: make this configurable
var connectionString = 'postgres://jiska:postgres@localhost/jiska';
var databaseTable = 'buurt';

var columnToName = {1: 'a', 2: 'b', 3: 'c', 4: 'd'};
var nameToColumn = {'a': 1, 'b': 2, 'c': 3, 'd': 4};

var aggregateToName = {1: 'aa', 2: 'bb', 3: 'cc', 4: 'dd', 5: 'ee'};

// Do not do any parsing for postgreSQL interval types
var types = require('pg').types;
types.setTypeParser(1186, function (val) {
  return val;
});

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
  var query = squel.expr();
  if (!facet) {
    return query;
  }

  var accessor = facet.accessor;
  facet.misval.forEach(function (value) {
    if (value === null) {
      query.and(accessor + ' IS NOT NULL');
    } else {
      if (facet.isContinuous) {
        query.and(accessor + ' != ' + (+value));
      } else if (facet.isCategorial) {
        if (typeof value === 'string') {
          query.and(accessor + " != '" + value.replace(/'/g, "''") + "'");
        } else {
          query.and(accessor + ' != ' + value);
        }
      } else if (facet.isTimeOrDuration) {
        if (facet.timeTransform.isDatetime) {
          query.and(accessor + " != TIMESTAMP WITH TIME ZONE '" + value + "'");
        } else if (facet.timeTransform.isDuration) {
          query.and(accessor + " != INTERVAL '" + value + "'");
        }
      }
    }
  });

  return query;
}

/**
 * Construct an expression for the WHERE clause to filter unselected data.
 * facet is `isCategorial` or `isTimeOrDuration`, and partition is `isCategorial`,
 * with a possible transform.
 * This results in an SQL query of the form:
 * `WHERE accessor LIKE ANY(ARRAY[rule,rule,...]) OR accessor IN (rule,rule,rule,...)`
 *
 * @params {Dataset} dataset
 * @params {facet} facet
 * @params {Partition} partition
 * @returns {Squel.expr} expression
 */
function whereAnyCat (dataset, facet, partition) {
  var column;
  var likeSet = [];
  var exactSet = [];

  // what rules lead to selected data?
  if (facet.isCategorial) {
    // directly use the SQL column
    column = facet.accessor;

    facet.categorialTransform.rules.forEach(function (rule) {
      var group = partition.groups.get(rule.group, 'value');
      if (group && group.isSelected) {
        if (rule.expression.match('%')) {
          likeSet.push("'" + rule.expression.replace(/'/g, "''") + "'");
        } else {
          exactSet.push("'" + rule.expression.replace(/'/g, "''") + "'");
        }
      }
      // FIXME: the 'Other' group would be the negative of all rules...?
    });
  } else {
    // apply transformation via the column expression
    column = columnExpression(dataset, facet, partition);
    partition.groups.forEach(function (group) {
      if (group.isSelected) {
        exactSet.push("'" + group.value.replace(/'/g, "''") + "'");
      }
    });
  }

  var query = squel.expr();
  if (likeSet.length) {
    query.or(column + ' LIKE ANY(ARRAY[' + likeSet.join(',') + '])');
  }
  if (exactSet.length) {
    query.or(column + ' IN (' + exactSet.join(',') + ')');
  }
  return query;
}

/**
 * Construct an expression for the WHERE clause to filter unselected data.
 * facet is `isTimeOrDuration`, partition is a `isDatetime`
 *
 * @params {Dataset} dataset
 * @params {facet} facet
 * @params {Partition} partition
 * @returns {Squel.expr} expression
 */
function whereTimeTime (dataset, facet, partition) {
  // ranges in transformed data
  var start;
  var end;
  var includeUpperBound;
  if (partition.selected.length > 0) {
    // only lower bound is inclusive for selections
    start = moment(partition.selected[0]);
    end = moment(partition.selected[1]);
    includeUpperBound = false;
  } else {
    // without selections, both min and max are included
    start = partition.minval;
    end = partition.maxval;
    includeUpperBound = true;
  }

  // get SQL column expression
  var column = columnExpression(dataset, facet, partition);

  var where = squel.expr();
  if (includeUpperBound) {
    where.and(column + " BETWEEN TIMESTAMP WITH TIME ZONE '" + start.toISOString() + "' AND TIMESTAMP WITH TIME ZONE '" + end.toISOString() + "'");
  } else {
    where.and(column + " >= TIMESTAMP WITH TIME ZONE '" + start.toISOString() + "'");
    where.and(column + "  < TIMESTAMP WITH TIME ZONE '" + end.toISOString() + "'");
  }
  return where;
}

/**
 * Construct an expression for the WHERE clause to filter unselected data.
 * facet is `isTimeOrDuration` or `isContinuous`, partition is a `isContinuous`
 *
 * @params {Dataset} dataset
 * @params {facet} facet
 * @params {Partition} partition
 * @returns {Squel.expr} expression
 */
function whereAnyCont (dataset, facet, partition) {
  // ranges in transformed data
  var start;
  var end;
  var includeUpperBound = false;
  var column;

  if (partition.selected.length > 0) {
    start = partition.selected[0];
    end = partition.selected[1];
    if (end === partition.maxval) {
      // upper bound is only included for partition.maxval
      includeUpperBound = true;
    }
  } else {
    // without selections, both boundaries are included
    start = partition.minval;
    end = partition.maxval;
    includeUpperBound = true;
  }

  if (facet.isContinuous) {
    // manually apply inverse transformation
    if (!facet.continuousTransform.isNone) {
      start = facet.continuousTransform.inverse(start);
      end = facet.continuousTransform.inverse(end);
    }
    // use SQL column name directly
    column = facet.accessor;
  } else if (facet.isTimeOrDuration) {
    // manually appply transformation
    var durationUnit = utilTime.durationUnits.get(facet.timeTransform.transformedUnits, 'format');
    column = 'EXTRACT( EPOCH FROM ' + facet.accessor + ') / ' + durationUnit.seconds.toString();
  }

  var where = squel.expr();
  if (includeUpperBound) {
    where.and(column + ' BETWEEN ' + start + ' AND ' + end);
  } else {
    where.and(column + '>=' + start);
    where.and(column + '<' + end);
  }
  return where;
}

/**
 * Construct an expression for the 'WHERE' clause to filter unselected data
 *
 * @params {Dataset} dataset
 * @params {Partition} partition
 * @returns {Squel.expr} expression
 */
function whereSelected (dataset, facet, partition) {
  if (facet.isContinuous) {
    if (partition.isContinuous) {
      return whereAnyCont(dataset, facet, partition);
    } else {
      console.error('Invalid combination of facet and partition');
    }
  } else if (facet.isCategorial) {
    if (partition.isCategorial) {
      return whereAnyCat(dataset, facet, partition);
    } else {
      console.error('Invalid combination of facet and partition');
    }
  } else if (facet.isTimeOrDuration) {
    if (partition.isDatetime) {
      return whereTimeTime(dataset, facet, partition);
    } else if (partition.isContinuous) {
      return whereAnyCont(dataset, facet, partition);
    } else if (partition.isCategorial) {
      return whereAnyCat(dataset, facet, partition);
    } else {
      console.error('Invalid combination of facet and partition');
    }
  }
}

/**
 * Create the SQL query part for a Continuous facet and partition
 * NOTE: data is labeled by group index, starting at 0
 *  * below min is mapped to -1
 *  * above max is mapped to partition.groups.length
 *
 * @function
 * @params {Dataset} dataset
 * @params {Facet} facet an isContinuous facet
 * @params {Partition} partition an isContinuous partition
 * @returns {string} query
 */
function columnExpressionContCont (dataset, facet, partition) {
  var query;
  var accessor = facet.accessor;

  if (facet.continuousTransform.isNone) {
    var min = partition.minval;
    var max = partition.maxval;
    var nbins = partition.groups.length;
    query = 'WIDTH_BUCKET(' + accessor + ',' + min + ',' + max + ',' + nbins + ') - 1';
  } else {
    // TODO: Use "width_bucket() - 1" for Postgresql 9.5 or later
    // From the docs: return the bucket number to which operand would be assigned given an array listing
    // the lower bounds of the buckets; returns 0 for an input less than the first lower bound;
    // the thresholds array must be sorted, smallest first, or unexpected results will be obtained

    // apply continuousTransform
    var lowerbounds = [];
    partition.groups.forEach(function (group, i) {
      lowerbounds[i] = facet.continuousTransform.inverse(group.min);
      lowerbounds[i + 1] = facet.continuousTransform.inverse(group.max);
    });

    // build CASE statement
    query = squel.case();

    var b = squel.expr().and(accessor + '<' + lowerbounds[0]);
    query.when(b.toString()).then(-1);

    var i;
    for (i = 0; i < lowerbounds.length - 1; i++) {
      b = squel.expr()
       .and(accessor + '>' + lowerbounds[i])
       .and(accessor + '<=' + lowerbounds[i + 1]);
      query.when(b.toString()).then(i);
    }
    query.else(partition.groups.length);
  }

  return query;
}

/**
 * Create the SQL query part for a categorial facet
 * NOTE: data is labeled by group index
 *
 * @function
 * @params {Dataset} dataset an isCategorial facet
 * @params {Facet} facet an isCategorial facet
 * @params {Partition} partition an isCategorial facet
 * @returns {string} query
 */
function columnExpressionCatCat (dataset, facet, partition) {
  var query = squel.case();
  var groups = [];

  // what groups/index are possible?
  partition.groups.forEach(function (group, i) {
    groups.push(group.value);
  });

  // what rules gave those groups?
  var rules = {};

  if (facet.categorialTransform.rules.length > 0) {
    // for each selected group
    groups.forEach(function (group) {
      // check all rules
      facet.categorialTransform.rules.forEach(function (rule) {
        // and add if relevant
        if (rule.group === group) {
          rules[rule.expression] = group; // TODO: escape?
        }
      });
    });
  } else {
    // for each selected group
    groups.forEach(function (group) {
      // add a rule
      rules[group] = group;
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
    query.when(facet.accessor + expression).then(rules[rule]);
  });
  query.else(0);

  return query;
}

/**
 * Create the SQL query part for a TimeOrDuration facet and any partition
 *
 * @function
 * @params {Dataset} dataset
 * @params {Facet} facet an isTimeOrDuration facet
 * @params {Partition} partition
 * @returns {string} query
 */
function columnExpressionTimeAny (dataset, facet, partition) {
  var expression;
  var reference;
  var durationUnit;
  var min;
  var max;
  var nbins;

  if (facet.timeTransform.isDatetime) {
    if (partition.isDatetime) {
      // not all time types support time zones, so only use if configured
      if (facet.timeTransform.zone === 'NONE' && facet.timeTransform.transformedZone === 'NONE') {
        expression = facet.accessor;
      } else {
        // datetime -> datetime
        if (facet.timeTransform.zone !== 'NONE') {
          // 1. force timeTransform.zone if not 'NONE'
          expression = '(' + facet.accessor + ")::timestamp AT TIME ZONE '" + facet.timeTransform.zone + "'";
        } else {
          // 2. otherwise use tz from column, and fallback to postrgres default timezone
          expression = '(' + facet.accessor + ')::timestamptz';
        }
        if (facet.transformedZone !== 'NONE') {
          // 3. transform to timeTransform.transformedZone
          expression += " AT TIME ZONE '" + facet.timeTransform.transformedZone + "'";
        }
      }
      expression = "date_trunc('" + partition.groupingTimeResolution + "', " + expression + ')';
    } else if (partition.isContinuous) {
      if (facet.timeTransform.transformedReference) {
        // datetime -> interval since reference
        durationUnit = utilTime.durationUnits.get(facet.timeTransform.transformedUnits, 'format');
        reference = facet.timeTransform.referenceMoment;
        expression = facet.accessor + "-'" + reference.toISOString() + "'::timestamptz";
        expression = 'EXTRACT( EPOCH FROM ' + expression + ') / ' + durationUnit.seconds.toString();

        min = partition.minval;
        max = partition.maxval;
        nbins = partition.groups.length;
        expression = 'WIDTH_BUCKET(' + expression + ',' + min + ',' + max + ',' + nbins + ') - 1';
      } else {
        // datetime -> datepart number
        expression = 'EXTRACT(' + facet.timeTransform.transformedFormat + ' FROM ' + facet.accessor + ')';
      }
    } else if (partition.isCategorial) {
      // datetime -> datepart
      expression = 'TO_CHAR(' + facet.accessor + ", '" + facet.timeTransform.transformedFormat + "')";
    } else {
      console.error('Invalid partition');
    }
  } else if (facet.timeTransform.isDuration) {
    if (partition.isDatetime) {
      // duration -> datetime
      reference = facet.timeTransform.referenceMoment;
      expression = facet.accessor + "+'" + reference.toISOString() + "'::timestamptz";
      expression = "DATE_TRUNC('" + partition.groupingTimeResolution + "', " + expression + ')';
    } else if (partition.isContinuous) {
      // duration -> number
      durationUnit = utilTime.durationUnits.get(facet.timeTransform.transformedUnits, 'format');
      expression = 'EXTRACT( EPOCH FROM ' + facet.accessor + ') / ' + durationUnit.seconds.toString();

      min = partition.minval;
      max = partition.maxval;
      nbins = partition.groups.length;
      expression = 'WIDTH_BUCKET(' + expression + ',' + min + ',' + max + ',' + nbins + ') - 1';
    } else {
      console.error('Invalid partition');
    }
  } else {
    console.error('Invalid combination of partition and facet');
  }
  return expression;
}

/**
 * Create the FIELD part for the SQL query,
 * used in SELECT and WHERE.
 *
 * This will also take care of the transforms.
 *
 * @function
 * @params {Dataset} dataset
 * @params {Facet} facet
 * @params {Partition} partition
 * @returns {string} query
 */
function columnExpression (dataset, facet, partition) {
  if (facet.isContinuous) {
    if (partition.isContinuous) {
      return columnExpressionContCont(dataset, facet, partition);
    } else {
      console.error('Invalid combination of partition and facet');
    }
  } else if (facet.isCategorial) {
    if (partition.isCategorial) {
      return columnExpressionCatCat(dataset, facet, partition);
    } else {
      console.error('Invalid combination of partition and facet');
    }
  } else if (facet.isTimeOrDuration) {
    return columnExpressionTimeAny(dataset, facet, partition);
  } else {
    console.error('Invalid facet');
  }
  return '';
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

    client.query("set intervalstyle = 'iso_8601';" + q.toString(), function (err, result) {
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
      var ncps = facet.continuousTransform.cps.length;
      if (ncps > 0) {
        prevX = facet.continuousTransform.cps.models[ncps - 1].x;
      }

      var x = row.unnest;
      if (x === +x && x !== prevX) {
        facet.continuousTransform.cps.add({
          x: x,
          fx: p[i] * 100
        });
      }
    });
    facet.continuousTransform.type = 'percentiles';
    io.syncFacets(dataset);
  });
}

function setExceedances (dataset, facet) {
  // TODO
  console.warn('setExceedances() not implemented for sql datasets');
  facet.continuousTransform.type = 'percentiles';
  io.syncFacets(dataset);
}

/**
 * Sets minimum and maximum value on a facet
 *
 * @function
 * @params {Dataset} Dataset
 * @params {Facet} facet
 */
function setMinMax (dataset, facet) {
  var query = squel.select()
    .from(databaseTable)
    .field('MIN(' + facet.accessor + ')', 'min')
    .field('MAX(' + facet.accessor + ')', 'max')
    .where(whereValid(facet).toString());

  queryAndCallBack(query, function (result) {
    var min = result.rows[0].min;
    var max = result.rows[0].max;

    facet.minvalAsText = min.toString();
    facet.maxvalAsText = max.toString();

    io.syncFacets(dataset);
  });
}

/**
 * setCategories finds finds all values on an ordinal (categorial) axis
 * Updates the categorialTransform of the facet
 *
 * @param {Dataset} dataset
 * @param {Facet} facet
 */
function setCategories (dataset, facet) {
  var query;

  // select and add results to the facet's cateogorialTransform
  query = squel
    .select()
    .field(facet.accessor, 'value')
    .field('COUNT(*)', 'count')
    .where(whereValid(facet))
    .from(databaseTable)
    .group('value')
    .order('count', false)
    .limit(50); // FIXME

  queryAndCallBack(query, function (result) {
    var rows = result.rows;

    rows.forEach(function (row) {
      facet.categorialTransform.rules.add({
        expression: row.value,
        count: parseFloat(row.count),
        group: row.value
      });
    });
    io.syncFacets(dataset);
  });
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
      var subtype;

      var SQLtype = field.dataTypeID;
      if (SQLtype === 1700 || SQLtype === 20 || SQLtype === 21 || SQLtype === 23 || SQLtype === 700 || SQLtype === 701) {
        type = 'continuous';
      } else if (SQLtype === 17) {
        // ignore:
        // 17: wkb_geometry
        console.warn('Ignoring column of type 17 (wkb_geometry)');
        return;
      } else if (SQLtype === 1184 || SQLtype === 1114 || SQLtype === 1186 || SQLtype === 1083 || SQLtype === 1266) {
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

    // send facets to client
    io.syncFacets(dataset);
  });
}

/**
 * Get data for a filter
 * @params {Dataset} dataset
 * @params {Filter} filter
 */
function getData (dataset, currentFilter) {
  console.time('getData for ' + currentFilter.id);
  var query = squel.select();

  // FIELD clause for this partition, combined with GROUP BY
  currentFilter.partitions.forEach(function (partition) {
    var columnName = columnToName[partition.rank];
    var facet = dataset.facets.get(partition.facetId);

    query.field(columnExpression(dataset, facet, partition), columnName);
    query.group(columnName);
  });

  // FIELD clause for this aggregate, combined with SUM(), AVG(), etc.
  if (currentFilter.aggregates.length > 0) {
    currentFilter.aggregates.forEach(function (aggregate) {
      var facet = dataset.facets.get(aggregate.facetId);
      query.field(aggregate.operation + '(' + facet.accessor + ')', aggregateToName[aggregate.rank]);
    });
  } else {
    // by default, do a count all:
    query.field('COUNT(*)', 'aa');
  }

  // FROM clause
  query.from(databaseTable);

  // WHERE clause for the facet for isValid / missing
  dataset.filters.forEach(function (filter) {
    filter.partitions.forEach(function (partition) {
      var facet = dataset.facets.get(partition.facetId);
      query.where(whereValid(facet));
    });
    // filter.aggregates.forEach(function (aggregate) {
    //   var facet = dataset.facets.get(aggregate.facetId);
    //   query.where(whereValid(facet));
    // });
  });

  // WHERE clause for all other filters reflecting the selection
  dataset.filters.forEach(function (filter) {
    if (filter.id !== currentFilter.id) {
      filter.partitions.forEach(function (partition) {
        var facet = dataset.facets.get(partition.facetId);
        query.where(whereSelected(dataset, facet, partition));
      });
    }
  });

  queryAndCallBack(query, function (result) {
    // Post process
    var rows = result.rows;

    // Re-format the data
    rows.forEach(function (row) {
      Object.keys(row).forEach(function (columnName) {
        if (!nameToColumn[columnName]) {
          return;
        }

        var column = nameToColumn[columnName];
        var partition = currentFilter.partitions.get(column, 'rank');
        var g = row[columnName];
        var facet = dataset.facets.get(partition.facetId);

        if ((facet.isContinuous && partition.isContinuous) ||
            (facet.isTimeOrDuration && partition.isContinuous)) {
          // Some fixes for corner cases:
          // minimum value of continuous facets is mapped to -1
          if (g === -1) {
            g = 0;
          }
          // maximum value can get mapped to ngroups (check)
          if (g === partition.groups.length) {
            g = g - 1;
          }
          // replace group index with actual value
          row[columnName] = partition.groups.models[g].value;
        } else if (facet.isTimeOrDuration && partition.isDatetime) {
          // Reformat datetimes to the same format as used by the client
          row[columnName] = moment(g).toString();
        }
      });
    });
    console.timeEnd('getData for ' + currentFilter.id);
    io.sendData(currentFilter, rows);
  });
}

/**
 * Get metadata for a dataset:
 *  * dataTotal the total number of datapoints in the SQL table
 *  * dataSelected the total number of datapoints passing all current filters
 *
 *  SELECT
 *    COUNT(*)
 *  FROM
 *    table
 *  WHERE
 *    whereValid for each facet linked to current filters
 *    whereSelected for each partition of each filter
 *  GROUP BY
 *    each partition
 *
 * @params {Dataset} dataset
 */
function getMetaData (dataset) {
  var subqueryA = squel.select().field('COUNT(*)', 'selected').from(databaseTable);

  // WHERE clause for the facet for isValid / missing
  // WHERE clause for all other filters reflecting the selection
  dataset.filters.forEach(function (filter) {
    filter.partitions.forEach(function (partition) {
      var facet = dataset.facets.get(partition.facetId);
      subqueryA.where(whereValid(facet));
      subqueryA.where(whereSelected(dataset, facet, partition));
    });
  });

  var subqueryB = squel.select().field('COUNT(*)', 'total').from(databaseTable);

  var query = squel
    .select()
    .from(subqueryA, 'A')
    .from(subqueryB, 'B')
    .field('A.selected', 'selected')
    .field('B.total', 'total');

  queryAndCallBack(query, function (result) {
    var row = result.rows[0];
    io.sendMetaData(row.total, row.selected);
  });
}

module.exports = {
  scanData: scanData,
  getMetaData: getMetaData,
  getData: getData,
  setMinMax: setMinMax,
  setCategories: setCategories,
  setPercentiles: setPercentiles,
  setExceedances: setExceedances
};
