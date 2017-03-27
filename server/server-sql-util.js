/**
 * Utility functions for SQL datasets for use on the server
 *
 * SELECT
 *   each filter.partition   where filter is from the view
 *   each filter.aggregate   where aggregate is from the view
 *   count (1)
 * FROM
 *   ...
 * GROUP BY
 *   each partition          where partition is from the view
 * ORDER BY
 *   ... for text facets either name or count
 * LIMIT
 *   ... for text facets
 *
 * UNION ALL ( over all active tables
 * SELECT
 *   each filter.partition mapped to this dataset.facet
 *   each filter.aggregate mapped to this dataset.facet
 *   COUNT(1)
 * FROM
 *   table
 * WHERE
 *   whereValid for each partition of each filter
 *   whereSelected for each partition of each filter
 *   whereValid for each aggregate of THIS filter
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
var utilTime = require('../framework/util/time');

var columnToName = {1: 'a', 2: 'b', 3: 'c', 4: 'd'};
var nameToColumn = {'a': 1, 'b': 2, 'c': 3, 'd': 4};

var aggregateToName = {1: 'aa', 2: 'bb', 3: 'cc', 4: 'dd', 5: 'ee'};

/* *****************************************************
 * SQL construction functions
 ******************************************************/

// wrap a identifier in double quotes, and escape literal quotes
function esc (string) {
  var escaped = string.replace('"', '""');
  return '"' + escaped + '"';
}

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

  var accessor = esc(facet.accessor);

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
      } else if (facet.isDatetime) {
        query.and(accessor + " != TIMESTAMP WITH TIME ZONE '" + value + "'");
      } else if (facet.isDuration) {
        query.and(accessor + " != INTERVAL '" + value + "'");
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
 * @params {Partition} partition an isContinuous partition
 * @params {Facet} facet an isContinuous facet
 * @params {Facet} subFacet (optional) an isContinuous facet
 * @returns {string} query
 */
function transformAndPartitionContinuous (expression, partition, facet, subFacet) {
  var query;

  // approach:
  // 1. start with the partitioning, take lower bounds of all bins;
  // 2. if defined, apply inverse transform of subFacet;
  // 3. if defined, apply inverse transform of facet;
  // 4. create width_bucket statement from the resulting lower bounds.

  var invSf;
  if (!subFacet || !subFacet.continuousTransform || subFacet.continuousTransform.isNone) {
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
  // select width_bucket(-10::real, array[0, 0.5, 1]::real[]); => 0
  // select width_bucket(0::real, array[0, 0.5, 1]::real[]);   => 1
  // select width_bucket(0.5::real, array[0, 0.5, 1]::real[]); => 2
  // select width_bucket(1::real, array[0, 0.5, 1]::real[]);   => 3
  query = 'WIDTH_BUCKET(' + expression + '::real, array[';
  query += lowerbounds.join(', ');
  query += ']::real[]) - 1';
  query = 'LEAST(' + query + ', ' + (partition.groups.length - 1) + ')';

  return query;
}

/*
 * Create the SQL query part for a categorial facet
 * NOTE: data is labeled by group index, starting at zero
 * * when no rule matches, return 'Other'
 *
 * @function
 * @params {Partition} partition an isCategorial facet
 * @params {Facet} facet an isCategorial facet
 * @params {Facet} subFacet (optional) an isCategorial facet
 * @returns {string} query
 */
function transformAndPartitionCategorial (expression, partition, facet, subFacet) {
  var query = squel.case();
  var transform = false;
  var rules;

  if (subFacet) {
    rules = subFacet.categorialTransform.rules;
    transform = facet.categorialTransform.transform;
  } else {
    rules = facet.categorialTransform.rules;
    transform = false;
  }

  // approach:
  // 1. get the range of first transformation; these are the rule.group values
  // 2. apply second transformation if present
  // 3. if result is valid, ie in the partition, add the expression
  rules.forEach(function (rule) {
    var group;
    if (transform) {
      group = transform(rule.group);
    } else {
      group = rule.group;
    }

    if (partition.groups.get(group, 'value')) {
      var subexpression = rule.expression.replace(/'/g, "''");

      var regexp = subexpression.match('^/(.*)/$');
      if (regexp) {
        // regexp matching
        subexpression = " LIKE '%" + regexp[1] + "%'";
      } else {
        // direct comparison
        subexpression = "='" + subexpression + "'";
      }
      query.when(expression + subexpression).then(group);
    }
  });
  query.else('Other');

  return query;
}

function transformExpression (expression, expressionType, transform) {
  // expressionType is either:   facet's transformed value is:
  // 1. datetime                 a. datetime
  // 2. duration                 b. duration
  // 3. continuous               c. continuous
  // 4. categorial               d. categorial
  // 5. text                     e. text

  var units;
  var reference;
  var timePart;
  var transformedType = transform.transformedType;

  if (expressionType === 'datetime' && transformedType === 'datetime') {
    if (transform.zone !== 'ISO8601') {
      // 1. force datetimeTransform.zone if not 'ISO8601'
      expression = '(' + expression + ")::timestamp AT TIME ZONE '" + transform.zone + "'";
    } else {
      // 2. otherwise use tz from column, and fallback to postgres default timezone
      expression = '(' + expression + ')::timestamptz';
    }
  } else if (expressionType === 'datetime' && transformedType === 'duration') {
    // 1b datetime -> duration
    reference = transform.referenceMoment.toISOString();
    expression = expression + "-'" + reference + "'::timestamptz";
  } else if (expressionType === 'datetime' && transformedType === 'continuous') {
    // 1c datetime -> continuous, ie datetime -> datepart number
    timePart = utilTime.timeParts.get(transform.transformedFormat, 'description');
    expression = 'EXTRACT(' + timePart.postgresFormat + ' FROM ' + expression + ')';
  } else if (expressionType === 'datetime' && transformedType === 'categorial') {
    // 1d datetime -> categorial
    timePart = utilTime.timeParts.get(transform.transformedFormat, 'description');
    expression = 'TRIM(FROM TO_CHAR(' + expression + ", '" + timePart.postgresFormat + "'))";
  } else if (expressionType === 'datetime' && transformedType === 'text') {
    // 1e datetime -> text
    // noop
  } else if (expressionType === 'duration' && transformedType === 'datetime') {
    // 2a duration -> datetime
    reference = transform.referenceMoment;
    expression = expression + "+'" + reference.toISOString() + "'::timestamptz";
  } else if (expressionType === 'duration' && transformedType === 'duration') {
    // 2b duration -> duration
    if (transform.units !== 'ISO8601') {
      expression = expression + ' * interval(1 ' + transform.units + ')';
    }
  } else if (expressionType === 'duration' && transformedType === 'continuous') {
    // 2c duration -> continuous
    units = utilTime.durationUnits.get(transform.transformedUnits, 'description');
    expression = 'EXTRACT( EPOCH FROM ' + expression + ') / ' + units.seconds.toString();
  } else if (expressionType === 'duration' && transformedType === 'text') {
    // 2e duration -> text
    // noop
  } else if (expressionType === 'continuous' && transformedType === 'text') {
    // 3e continuous -> text
    // noop
  } else if (expressionType === 'categorial' && transformedType === 'text') {
    // 4e categorial -> text
    // noop
  } else if (expressionType === 'text' && transformedType === 'text') {
    // 5e text -> text
    // noop
  } else {
    // 2d duration -> categorial
    // 3a continuous -> datetime
    // 3d continuous -> categorial
    // 4a categorial -> datetime
    // 4b categorial -> duration
    // 4c categorial -> continuous
    // 5a text -> datetime
    // 5c text -> continuous
    // 5d text -> categorial
    console.error('Invalid transform: ', expressionType, transformedType);

    // fast path will be used:
    // 3c continuous -> continuous
    // 4d categorial -> categorial
  }

  return expression;
}

/**
 * @params {squel|string} expression SquelJS query or plain string to group
 * @params {Partition} partition Partition describing the grouping
 */
function groupExpression (expression, partition) {
  var resolution;
  var units;

  if (partition.isContinuous) {
    var x0;
    var x1;
    var nbins;
    var size;

    if (partition.groupFixedN) {
      // A fixed number of equally sized bins
      nbins = partition.groupingParam;
      x0 = partition.minval;
      x1 = partition.maxval;
      size = (x1 - x0) / nbins;
    } else if (partition.groupFixedS) {
      // A fixed bin size
      size = partition.groupingParam;
      x0 = Math.floor(partition.minval / size) * size;
      x1 = Math.ceil(partition.maxval / size) * size;
      nbins = (x1 - x0) / size;
    } else if (partition.groupFixedSC) {
      // A fixed bin size, centered on 0
      size = partition.groupingParam;
      x0 = (Math.floor(partition.minval / size) - 0.5) * size;
      x1 = (Math.ceil(partition.maxval / size) + 0.5) * size;
      nbins = (x1 - x0) / size;
    } else if (partition.groupLog) {
      // Fixed number of logarithmically (base 10) sized bins
      nbins = partition.groupingParam;
      x0 = Math.log(partition.minval) / Math.log(10.0);
      x1 = Math.log(partition.maxval) / Math.log(10.0);
      size = (x1 - x0) / nbins;
    }
    expression = 'WIDTH_BUCKET(' + expression + '::real, ' + x0 + ', ' + x1 + ', ' + nbins + ') - 1';
    expression = 'LEAST(' + expression + ', ' + (nbins - 1) + ')';
    return expression;
  } else if (partition.isCategorial) {
    // noop
    return expression;
  } else if (partition.isDatetime) {
    // set timezone
    expression = '(' + expression + ")::timestamptz AT TIME ZONE '" + partition.zone + "'";

    // find resolution
    resolution = utilTime.getDatetimeResolution(partition.minval, partition.maxval);
    units = utilTime.durationUnits.get(resolution, 'description').postgresFormat;

    // truncate
    return "DATE_TRUNC('" + units + "', " + expression + ')';
  } else if (partition.isDuration) {
    resolution = utilTime.getDurationResolution(partition.minval, partition.maxval);
    units = utilTime.durationUnits.get(resolution, 'description').postgresFormat;

    return "DATE_TRUNC('" + units + "', " + expression + ')';
  } else if (partition.isText) {
    // noop
    return expression;
  } else {
    console.warn('Invalid partition in groupExression()', partition.toJSON());
  }
  return '';
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
  var expression = esc(subFacet.accessor);

  // combinend double transform and partitioning queries
  if (facet.isContinuous && subFacet.isContinuous) {
    return transformAndPartitionContinuous(expression, partition, facet, subFacet);
  } else if (facet.isCategorial && subFacet.isCategorial) {
    return transformAndPartitionCategorial(expression, partition, facet, subFacet);
  } else if (facet.isText && subFacet.isText) {
    return esc(subFacet.accessor);
  }

  // other transformations
  expression = transformExpression(expression, subFacet.type, subFacet.transform);

  // combinend single transform and partitioning queries
  if (facet.isContinuous && subFacet.isContinuous) {
    return transformAndPartitionContinuous(expression, partition, facet);
  } else if (facet.isCategorial && subFacet.isCategorial) {
    return transformAndPartitionCategorial(expression, partition, facet);
  }

  // other transformations
  expression = transformExpression(expression, facet.type, facet.transform);

  // and partition
  expression = groupExpression(expression, partition);

  return expression;
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
  // 3. if defined, apply inverse transform of facet;
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
  where.and(esc(subFacet.accessor) + '>=' + val);

  // upperboundary only included in corner cases
  var op;
  if (partition.selected.length === 2) {
    val = invF(invSf(partition.selected[1]));
    op = partition.selected[1] === partition.maxval ? '<=' : '<';
  } else {
    val = invF(invSf(partition.maxval));
    op = '<=';
  }
  where.and(esc(subFacet.accessor) + op + val);

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
    where.or(esc(subFacet.accessor) + " = ANY('{" + exactRules.join(', ') + "}')");
  }
  if (fuzzyRules.length > 0) {
    where.or(esc(subFacet.accessor) + " LIKE ANY('{" + fuzzyRules.join(', ') + "}')");
  }

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
function whereText (facet, partition) {
  if (partition.selected && partition.selected.length > 0) {
    return esc(facet.accessor) + " IN ($Quoted$" + partition.selected.join("$Quoted$, $Quoted$") + "$Quoted$) ";
  } else {
    return '';
  }
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
  } else if (facet.isText) {
    return whereText(subFacet, partition);
  }

  // general queries for more difficult transforms
  var expression = esc(subFacet.accessor);

  // transform
  expression = transformExpression(expression, subFacet.type, subFacet.transform);
  expression = transformExpression(expression, facet.type, facet.transform);

  // and apply selection
  var s;
  var e;
  var inclusive;

  if (partition.isContinuous) {
    if (partition.selected && partition.selected.length > 0) {
      s = partition.selected[0];
      e = partition.selected[1];
      inclusive = e === partition.maxval.toISOString();
    } else {
      s = partition.minval;
      e = partition.maxval;
      inclusive = true;
    }

    if (inclusive) {
      expression = expression + ' BETWEEN ' + s + ' AND ' + e;
    } else {
      expression = expression + ' >= ' + s + ' AND ' + expression + ' < ' + e;
    }
  } else if (partition.isCategorial) {
    if (partition.selected && partition.selected.length > 0) {
      expression = expression + " IN ($Quoted$" + partition.selected.join("$Quoted$, $Quoted$") + "$Quoted$) ";
    } else {
      var groups = [];
      facet.categorialTransform.rules.forEach(function (rule) {
        groups.push(rule.group);
      });
      expression = expression + " IN ($Quoted$" + groups.join("$Quoted$, $Quoted$") + "$Quoted$) ";
    }
  } else if (partition.isDatetime || partition.isDuration) {
    if (partition.selected && partition.selected.length > 0) {
      s = partition.selected[0];
      e = partition.selected[1];
      inclusive = e === partition.maxval.toISOString();
    } else {
      s = partition.minval.toISOString();
      e = partition.maxval.toISOString();
      inclusive = true;
    }

    if (inclusive) {
      expression = expression + " BETWEEN '" + s + "' AND '" + e + "'";
    } else {
      expression = expression + " >= '" + s + "' AND " + expression + " < '" + e + "'";
    }
  }
  return expression;
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
  query += esc(facet.accessor) + ')) FROM ' + esc(dataset.databaseTable);
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
    .from(esc(dataset.databaseTable))
    .field('MIN(' + esc(facet.accessor) + ')', 'min')
    .field('MAX(' + esc(facet.accessor) + ')', 'max')
    .where(whereValid(facet).toString());

  utilPg.queryAndCallBack(query, function (result) {
    if (result.rows && result.rows.length > 0) {
      facet.minvalAsText = result.rows[0].min.toString();
      facet.maxvalAsText = result.rows[0].max.toString();
    }

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

  // select and add results to the facet's categorialTransform
  query = squel
    .select()
    .field(esc(facet.accessor), 'category')
    .field('COUNT(1)', 'count')
    .where(whereValid(facet))
    .from(esc(dataset.databaseTable))
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
 * @function
 */
function scanData (dataset) {
  var query = squel.select().distinct().from(esc(dataset.databaseTable)).limit(50);
  utilPg.queryAndCallBack(query, function (data) {
    utilPg.parseRows(data, dataset);
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

  // FIELD clause for all aggregates, combined with SUM(), AVG(), etc., and a WHERE clause reflecting isValid
  currentFilter.aggregates.forEach(function (aggregate) {
    var subfacet = dataset.facets.get(aggregate.facetName, 'name');
    var ops = aggregate.operation;
    if (ops !== 'stddev') {
      query.field(aggregate.operation + '(' + esc(subfacet.accessor) + ')', aggregateToName[aggregate.rank]);
    } else {
      query.field('sum (' + esc(subfacet.accessor) + ')', aggregateToName[aggregate.rank]);
      query.field('sum (' + esc(subfacet.accessor) + ' * ' + esc(subfacet.accessor) + ' )', aggregateToName[aggregate.rank] + '_ss');
    }
    query.where(whereValid(subfacet));
  });

  // FIELD clause for a total count
  query.field('COUNT(1)', 'count');

  // FROM clause
  query.from(esc(dataset.databaseTable));

  // WHERE clause for all partitions of all filters reflecting isValid and possible selection
  dataview.filters.forEach(function (filter) {
    filter.partitions.forEach(function (partition) {
      var facet = dataview.facets.get(partition.facetName, 'name');
      var subFacet = dataset.facets.get(partition.facetName, 'name');

      if (filter.id === currentFilter.id) {
        // for our own filter, temporarily remove selection
        var selected = partition.selected;
        partition.selected = [];
      }

      query.where(whereValid(facet));
      query.where(whereSelected(facet, subFacet, partition));

      if (filter.id === currentFilter.id) {
        // for our own filter, restore selection
        partition.selected = selected;
      }
    });
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
      var col = aggregateToName[aggregate.rank];

      if (ops === 'count') {
        ops = 'sum(' + col + ')';
      } else if (ops === 'sum') {
        ops = 'sum(' + col + ')';
      } else if (ops === 'avg') {
        ops = 'sum(' + col + ' * count ) / sum(count)';
      } else if (ops === 'min') {
        ops = 'min(' + col + ')';
      } else if (ops === 'max') {
        ops = 'max(' + col + ')';
      } else if (ops === 'stddev') {
        // FIXME: not numerically identical to stddev..?
        ops = 'sqrt((sum(' + col + '_ss) - sum(' + col + ') * sum(' + col + ') / sum(count)) / (sum(count) - 1))';
      }
      query.field(ops, aggregateToName[aggregate.rank]);
    });
  }

  // by default, do a count all:
  query.field('sum(count)', 'count');

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

  // TODO queries involving free text columns should be limited and ordered
  // query.order('', true);
  // query.limit();

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
          row[columnName] = moment(g, moment.ISO_8601).tz(partition.zone).format();
        }
      });
    });
    io.sendData(currentFilter, rows);
  });
}

/**
 * Get metadata for a dataset:
 *  * dataTotal the total number of datapoints in the SQL table
 *  * dataSelected the total number of datapoints passing all current filters
 *
 *  SELECT
 *    SUM(selected.count) AS selected,
 *    SUM(total.count) AS total
 *  FROM
 *  UNION ALL (
 *    SELECT
 *      COUNT (1) AS count
 *    WHERE
 *      whereValid for each facet linked to current filters
 *      whereSelected for each partition of each filter, with empty selection
 *  ) AS total,
 *  UNION ALL (
 *    SELECT
 *      COUNT (1) AS count
 *    WHERE
 *      whereValid for each facet linked to current filters
 *      whereSelected for each partition of each filter
 *  ) AS selected
 *
 * @params {Dataset[]} datasets
 * @params {Dataset} dataview
 */
function getMetaData (datasets, dataview) {
  var query = squel.select();

  // FIELD clause for this partition, combined with GROUP BY
  query.field('sum(selected.count)', 'selected');
  query.field('sum(total.count)', 'total');

  // FROM clauses
  var selectedUnion;
  var totalUnion;
  var tables = dataview.databaseTable.split('|');

  datasets.forEach(function (dataset) {
    if (tables.indexOf(dataset.databaseTable) !== -1) {
      var selectedQuery = squel.select();
      var totalQuery = squel.select();

      // keep a total count
      selectedQuery.field('COUNT(1)', 'count');
      totalQuery.field('COUNT(1)', 'count');

      // FROM clause
      selectedQuery.from(esc(dataset.databaseTable));
      totalQuery.from(esc(dataset.databaseTable));

      // WHERE clause for all facets for isValid / missing
      dataview.filters.forEach(function (filter) {
        filter.partitions.forEach(function (partition) {
          var facet = dataset.facets.get(partition.facetName, 'name');
          selectedQuery.where(whereValid(facet));
          totalQuery.where(whereValid(facet));
        });
      });

      // WHERE clause for all filters selection or range
      dataview.filters.forEach(function (filter) {
        filter.partitions.forEach(function (partition) {
          var facet = dataview.facets.get(partition.facetName, 'name');
          var subFacet = dataset.facets.get(partition.facetName, 'name');
          selectedQuery.where(whereSelected(facet, subFacet, partition));
        });

        filter.partitions.forEach(function (partition) {
          var facet = dataview.facets.get(partition.facetName, 'name');
          var subFacet = dataset.facets.get(partition.facetName, 'name');

          var selected = partition.selected;
          partition.selected = [];

          totalQuery.where(whereSelected(facet, subFacet, partition));

          partition.selected = selected;
        });
      });

      if (selectedUnion && totalUnion) {
        selectedUnion.union_all(selectedQuery);
        totalUnion.union_all(totalQuery);
      } else {
        selectedUnion = selectedQuery;
        totalUnion = totalQuery;
      }
    }
  });
  query.from(selectedUnion, 'selected');
  query.from(totalUnion, 'total');

  console.log(dataview.id + ': ' + query.toString());
  utilPg.queryAndCallBack(query, function (result) {
    io.sendMetaData(dataview, result.rows[0].total, result.rows[0].selected);
  });
}

module.exports = {
  transformExpression: transformExpression,
  scanData: scanData,
  getMetaData: getMetaData,
  getData: getData,
  setMinMax: setMinMax,
  setCategories: setCategories,
  setPercentiles: setPercentiles
};
