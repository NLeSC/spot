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
 * SELECT
 *   each filter.partition   where filter is from the view
 *   each filter.aggregate   where aggregate is from the view
 *   count (1)
 * FROM
 *   ...
 * GROUP BY
 *   each partition          where partition is from the view
 *
 * UNION ALL (
 * map filter.partition to this dataset.facet
 * map filter.aggregate to t
 * SELECT
 *   each filter.partition
 *   each filter.aggregate
 *   COUNT(1)
 * FROM
 *   table1
 * WHERE
 *   whereValid for each facet linked to current filters
 *   whereSelected for each partition of each filter
 * GROUP BY
 *   each partition
 * )
 *
 *
 * @module client/util-sql
 */
var io = require('./server-socket');
var squel = require('squel').useFlavour('postgres');
var utilPg = require('./server-postgres');
var moment = require('moment-timezone');
// var utilTime = require('../framework/util/time');

var columnToName = {1: 'a', 2: 'b', 3: 'c', 4: 'd'};
var nameToColumn = {'a': 1, 'b': 2, 'c': 3, 'd': 4};

var aggregateToName = {1: 'aa', 2: 'bb', 3: 'cc', 4: 'dd', 5: 'ee'};

/* *****************************************************
 * SQL construction functions
 ******************************************************/

/**
 * Construct an expression for the 'WHERE' clause to filter invalid data
 * Data is considered valid if it is not equal to one of the `facet.misval`.
 * The type of the misval should match that of the facet.
 * * also include IS NOT NULL (NULL values are mapped to missing values)
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

  // force NULL to be a missing value
  var values = facet.misval;
  values.push(null);

  values.forEach(function (value) {
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

/*
 * Create the SQL query part for a Continuous facet and partition
 * NOTE: data is labeled by group index, starting at 0
 *  * below min is mapped to -1
 *  * above max is mapped to partition.groups.length
 *
 * @function
 * @params {Facet} facet an isContinuous facet
 * @params {Facet} subFacet
 * @params {Partition} partition an isContinuous partition
 * @returns {string} query
 */
function columnExpressionContCont (facet, subFacet, partition) {
  var query;

  // approach:
  // 1. start with the partitioning, take lower bounds of all bins;
  // 2. if defined, apply inverse transform of subFacet;
  // 3. if defined, applh inverse transform of facet;
  // 4. create width_bucket statement from the resulting lower bounds.

  var invSf;
  if (!subFacet.continuousTransform || subFacet.continuousTransform.isNone) {
    invSf = function (d) { return d; };
  } else {
    invSf = subFacet.continuousTransform.inverse;
  }

  var invF;
  if (!facet.continuousTransform || facet.continuousTransform.isNone) {
    invF = function (d) { return d; };
  } else {
    invF = facet.continuousTransform.inverse;
  }

  var lowerbounds = [];
  partition.groups.forEach(function (group, i) {
    lowerbounds[i] = invF(invSf(group.min));
    lowerbounds[i + 1] = invF(invSf(group.max));
  });

  // NOTE: lower boundary included in interval, we clamp to nbins-1
  // to also include upper boundary
  // select width_bucket(0::real, array[0, 0.5, 1]::real[]);   => 1
  // select width_bucket(0.5::real, array[0, 0.5, 1]::real[]); => 2
  // select width_bucket(1::real, array[0, 0.5, 1]::real[]);   => 3
  query = 'WIDTH_BUCKET(' + facet.accessor + '::real, array[';
  query += lowerbounds.join(', ');
  query += ']::real[]) - 1';
  query = 'LEAST(' + query + ', ' + partition.groups.length + '-1)';

  return query;
}

/*
 * Create the SQL query part for a categorial facet
 * NOTE: data is labeled by group index, starting at zero
 * * when no rule matches, return 'Other'
 *
 * @function
 * @params {Facet} facet an isCategorial facet
 * @params {Facet} subFacet
 * @params {Partition} partition an isCategorial facet
 * @returns {string} query
 */
function columnExpressionCatCat (facet, subFacet, partition) {
  var query = squel.case();

  // approach: for each rule in subFacet
  // 1. apply subFacet transform, ie. get the group
  // 2. apply the categorialTransform from the facet
  // 3. if result is included in the partition, add the expression
  subFacet.categorialTransform.rules.forEach(function (rule) {
    var group = facet.categorialTransform.transform(rule.group);

    if (partition.groups.get(group, 'value')) {
      var expression = rule.expression.replace(/'/g, "''");

      var regexp = expression.match('^/(.*)/$');
      if (regexp) {
        // regexp matching
        expression = " LIKE '%" + regexp[1] + "%'";
      } else {
        // direct comparison
        expression = "='" + expression + "'";
      }
      query.when(facet.accessor + expression).then(group);
    }
  });
  query.else('Other');

  return query;
}

/**
 * Create the FIELD part for the SQL query,
 * used in SELECT and WHERE.
 *
 * This will also take care of the transforms.
 *
 * @function
 * @params {Facet} facet a facet of the combined dataset
 * @params {Facet} subFacet a facet of a real facet, ie. column of a database table
 * @params {Partition} partition a partitioning on the facet
 * @returns {Squel.expr} expression
 */
function columnExpression (facet, subFacet, partition) {
  /*
   *  facet.type:   transformedType:
   *  categorial    categorial
   *  continuous    continuous
   *  datetime      datetime
   *                categorial
   *                continuous
   */

  // optimized queries for the most common cases
  if (facet.isContinuous && subFacet.isContinuous) {
    return columnExpressionContCont(facet, subFacet, partition);
  } else if (facet.isCategorial && subFacet.isCategorial) {
    return columnExpressionCatCat(facet, subFacet, partition);
  }

  // general queries for more difficult transforms
  console.error('Not implemented');
  return '';
}

/*
 * Construct an expression for the 'WHERE' clause to filter unselected data
 *
 * @params {Facet} facet
 * @params {Facet} subFacet
 * @params {Partition} partition
 * @returns {Squel.expr} expression
 */
function whereContCont (facet, subFacet, partition) {
  var where = squel.expr();

  // approach:
  // 1. start with the partitioning, take lower bounds of all bins;
  // 2. if defined, apply inverse transform of subFacet;
  // 3. if defined, applh inverse transform of facet;
  // 4. create width_bucket statement from the resulting lower bounds.

  var invSf;
  if (!subFacet.continuousTransform || subFacet.continuousTransform.isNone) {
    invSf = function (d) { return d; };
  } else {
    invSf = subFacet.continuousTransform.inverse;
  }

  var invF;
  if (!facet.continuousTransform || facet.continuousTransform.isNone) {
    invF = function (d) { return d; };
  } else {
    invF = facet.continuousTransform.inverse;
  }

  var val;
  // lower boundary always included
  if (partition.selected.length === 2) {
    val = invF(invSf(partition.selected[0]));
  } else {
    val = invF(invSf(partition.minval));
  }
  where.and(subFacet.accessor + '>=' + val);

  // upperboundary only included in corner cases
  var op;
  if (partition.selected.length === 2) {
    val = invF(invSf(partition.selected[1]));
    op = partition.selected[1] === partition.maxval ? '<=' : '<';
  } else {
    val = invF(invSf(partition.maxval));
    op = '<=';
  }
  where.and(subFacet.accessor + op + val);

  return where;
}

/*
 * Construct an expression for the 'WHERE' clause to filter unselected data
 *
 * @params {Facet} facet
 * @params {Facet} subFacet
 * @params {Partition} partition
 * @returns {Squel.expr} expression
 */
function whereCatCat (facet, subFacet, partition) {
  // approach: for each rule in subFacet
  // 1. apply subFacet transform, ie. get the group
  // 2. apply the categorialTransform from the facet
  // 3. if result is included in the partition, add the expression

  var exactRules = [];
  var fuzzyRules = [];
  subFacet.categorialTransform.rules.forEach(function (rule) {
    var group = facet.categorialTransform.transform(rule.group);
    if (partition.selected.indexOf(group) !== -1) {
      var expression = rule.expression.replace(/'/g, "''");

      var regexp = expression.match('^/(.*)/$');
      if (regexp) {
        // regexp matching
        fuzzyRules.push('%' + regexp[1] + '%');
      } else {
        // direct comparison
        exactRules.push(expression);
      }
    }
  });

  var where = squel.expr();

  // expression operator ANY (array expression)
  if (exactRules.length > 0) {
    where.or(facet.accessor + " = ANY('{" + exactRules.join(', ') + "}')");
  }
  if (fuzzyRules.length > 0) {
    where.or(facet.accessor + " LIKE ANY('{" + fuzzyRules.join(', ') + "}')");
  }

  return where;
}

/**
 * Construct an expression for the 'WHERE' clause to filter unselected data
 *
 * @params {Facet} facet
 * @params {Facet} subFacet
 * @params {Partition} partition
 * @returns {Squel.expr} expression
 */
function whereSelected (facet, subFacet, partition) {
  // optimized queries for the most common cases
  if (facet.isContinuous && subFacet.isContinuous) {
    return whereContCont(facet, subFacet, partition);
  } else if (facet.isCategorial && subFacet.isCategorial) {
    return whereCatCat(facet, subFacet, partition);
  }
}

/* *****************************************************
 * spot-server callbacks
 ******************************************************/

function setPercentiles (dataset, facet) {
  // NOTE: requires at least postgres 9.4
  // select unnest(percentile_disc(array[...]) within group (order by ...)) from ...

  facet.continuousTransform.reset();

  var p = [];
  var i;
  for (i = 0; i < 101; i++) {
    p[i] = i / 100;
  }
  var valid = whereValid(facet).toString();
  var query = 'SELECT unnest(percentile_cont(array[' + p.toString() + ']) WITHIN GROUP (ORDER BY ';
  query += facet.accessor + ')) FROM ' + dataset.databaseTable;
  if (valid.length > 0) {
    query += ' WHERE ' + valid;
  }

  utilPg.queryAndCallBack(query, function (data) {
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

/**
 * Sets minimum and maximum value on a facet
 *
 * @function
 * @params {Dataset} Dataset
 * @params {Facet} facet
 */
function setMinMax (dataset, facet) {
  var query = squel.select()
    .from(dataset.databaseTable)
    .field('MIN(' + facet.accessor + ')', 'min')
    .field('MAX(' + facet.accessor + ')', 'max')
    .where(whereValid(facet).toString());

  utilPg.queryAndCallBack(query, function (result) {
    facet.minvalAsText = result.rows[0].min.toString();
    facet.maxvalAsText = result.rows[0].max.toString();

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
    .field(facet.accessor, 'category')
    .field('COUNT(*)', 'count')
    .where(whereValid(facet))
    .from(dataset.databaseTable)
    .group('category')
    .order('count', false);

  utilPg.queryAndCallBack(query, function (result) {
    var rows = result.rows;

    facet.categorialTransform.rules.reset();

    rows.forEach(function (row) {
      facet.categorialTransform.rules.add({
        expression: row.category.toString(),
        count: parseFloat(row.count),
        group: row.category.toString()
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
  var query = squel.select().distinct().from(dataset.databaseTable).limit(50);

  utilPg.queryAndCallBack(query, function (data) {
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
      } else if (utilPg.SQLDatetimeTypes.indexOf(SQLtype) > -1) {
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
 * @params {Dataset} dataview
 * @params {Dataset} subDataset
 * @params {Filter} filter
 */
function subTableQuery (dataview, dataset, currentFilter) {
  var query = squel.select();

  // FIELD clause for this partition, combined with GROUP BY
  currentFilter.partitions.forEach(function (partition) {
    var columnName = columnToName[partition.rank];
    var facet = dataview.facets.get(partition.facetName, 'name');
    var subFacet = dataset.facets.get(partition.facetName, 'name');

    query.field(columnExpression(facet, subFacet, partition), columnName);
    query.group(columnName);
  });

  // FIELD clause for this aggregate, combined with SUM(), AVG(), etc.
  if (currentFilter.aggregates.length > 0) {
    currentFilter.aggregates.forEach(function (aggregate) {
      var facet = dataset.facets.get(aggregate.facetName, 'name');
      query.field(aggregate.operation + '(' + facet.accessor + ')', aggregateToName[aggregate.rank]);
    });
  } else {
    // by default, do a count all:
    query.field('COUNT(1)', 'aa');
  }

  // FROM clause
  query.from(dataset.databaseTable);

  // WHERE clause for all facets for isValid / missing
  dataview.filters.forEach(function (filter) {
    filter.partitions.forEach(function (partition) {
      var facet = dataset.facets.get(partition.facetName, 'name');
      query.where(whereValid(facet));
    });
    filter.aggregates.forEach(function (aggregate) {
      var facet = dataset.facets.get(aggregate.facetName, 'name');
      query.where(whereValid(facet));
    });
  });

  // WHERE clause for all other filters reflecting the selection
  dataview.filters.forEach(function (filter) {
    if (filter.id !== currentFilter.id) {
      filter.partitions.forEach(function (partition) {
        var facet = dataview.facets.get(partition.facetName, 'name');
        var subFacet = dataset.facets.get(partition.facetName, 'name');
        query.where(whereSelected(facet, subFacet, partition));
      });
    } else {
      // for our own filter, temporarily remove selection,
      // but we still need a 'where' clause for ranges [min, max] etc.
      filter.partitions.forEach(function (partition) {
        var facet = dataview.facets.get(partition.facetName, 'name');
        var subFacet = dataset.facets.get(partition.facetName, 'name');

        var selected = partition.selected;
        partition.selected = [];

        query.where(whereSelected(facet, subFacet, partition));

        partition.selected = selected;
      });
    }
  });

  return query;
}

/**
 * Get data for a filter
 * @params {Dataset[]} datasets
 * @params {Dataset} dataview
 * @params {Filter} filter
 */
function getData (datasets, dataview, currentFilter) {
  console.time(currentFilter.id + ': getData');
  var query = squel.select();

  // FIELD clause for this partition, combined with GROUP BY
  currentFilter.partitions.forEach(function (partition) {
    var columnName = columnToName[partition.rank];
    query.field(columnName, columnName);
    query.group(columnName);
  });

  // FIELD clause for this aggregate, combined with SUM(), AVG(), etc.
  // NOTE: Because of the way we split the query over sub tables,
  // the count() operation turns into a sum()
  if (currentFilter.aggregates.length > 0) {
    currentFilter.aggregates.forEach(function (aggregate) {
      var ops = aggregate.operation;
      if (ops === 'count') {
        ops = 'sum';
      }
      query.field(ops + '(' + aggregateToName[aggregate.rank] + ')', aggregateToName[aggregate.rank]);
      // FIXME: avg should be weighted by proper count
    });
  } else {
    // by default, do a count all:
    query.field('sum(aa)', 'aa');
  }

  // FROM clause for the dataview
  var datasetUnion = null;
  var tables = dataview.databaseTable.split('|');
  datasets.forEach(function (dataset) {
    if (tables.indexOf(dataset.databaseTable) !== -1) {
      var subTable = subTableQuery(dataview, dataset, currentFilter);
      if (datasetUnion) {
        datasetUnion.union_all(subTable);
      } else {
        datasetUnion = subTable;
      }
    }
  });
  query.from(datasetUnion, 'datasetUnion');

  console.log(currentFilter.id + ': ' + query.toString());
  utilPg.queryAndCallBack(query, function (result) {
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

        if (partition.isContinuous) {
          // Replace group index with actual value
          row[columnName] = partition.groups.models[g].value;
        } else if (partition.isDatetime) {
          // Reformat datetimes to the same format as used by the client
          row[columnName] = moment(g).toString();
        }
      });
    });
    console.timeEnd(currentFilter.id + ': getData');
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
  // TODO
  io.sendMetaData(dataset, 0, 0);
  return;
}

module.exports = {
  scanData: scanData,
  getMetaData: getMetaData,
  getData: getData,
  setMinMax: setMinMax,
  setCategories: setCategories,
  setPercentiles: setPercentiles
};
