'use strict';

var Dataset = require('./client/models/dataset-sql');
var Facet = require('./client/models/facet');
var util = require('./client/util-sql');

var io = require('socket.io')(3080);
var pg = require('pg');
pg.defaults.poolSize = 75; // SHOW max_connections

var squel = require('squel').useFlavour('postgres');

// TODO: make this configurable
var conString = 'postgres://jiska:postgres@localhost/jiska';
var DatabaseTable = 'buurtonly';

var dataset = new Dataset();

var scanAndReply = function (data) {
  var nfields = data.fields.length;

  // remove previous facets
  dataset.filters.reset();
  dataset.facets.reset();

  var doneFields = 0;
  var reply = function () {
    doneFields++;
    if (doneFields === nfields) {
      console.log('server pushes: sync-facets');
      io.emit('sync-facets', dataset.toJSON());
    }
  };

  var field;
  for (field = 0; field < nfields; field++) {
    let query;
    let name = data.fields[field].name;
    let description = 'Automatically detected facet, please check configuration';

    // TODO: guess missing data indicators, could be something with
    // ' select (abs(p_ongehuwd)/p_ongehuwd) * trunc(log(abs(p_ongehuwd))) as d, count(p_ongehuwd) from buurtonly group by d order by d asc; '

    // dataTypeID: 1700,         numeric
    // dataTypeID: 20, 21, 23,   integers
    // dataTypeID: 700, 701,     float8
    var type = data.fields[field].dataTypeID;
    if (type === 1700 || type === 20 || type === 21 || type === 23 || type === 700 || type === 701) {
      let addContinuous = function (result) {
        dataset.facets.add({
          name: name,
          accessor: name,
          type: 'continuous',
          minvalAsText: result.rows[0].min.toString(),
          maxvalAsText: result.rows[0].max.toString(),
          description: description
        });
        reply();
      };
      query = squel.select()
        .from(DatabaseTable)
        .field('MIN(' + name + ')', 'min')
        .field('MAX(' + name + ')', 'max');

      QueryAndCallBack(query, addContinuous);
    } else {
      let addCategorial = function (result) {
        dataset.facets.add({
          name: name,
          accessor: name,
          type: 'categorial',
          categories: result.rows,
          description: description
        });
        reply();
      };
      let query = squel.select()
        .from(DatabaseTable)
        .field(name, 'category')
        .field(name, 'group')
        .field('COUNT(' + name + ')', 'count')
        .group('"group"')
        .group('"category"');

      QueryAndCallBack(query, addCategorial);
    }
  }
};

var QueryAndCallBack = function (q, cb) {
  pg.connect(conString, function (err, client, done) {
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
};

var filterWhereClause = function (filter) {
  var where = '';
  if (!filter.primary) {
    console.error('No primary facet for filter', filter.toString());
    return '';
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
    }
  }
  return where;
};

var getDataAndReply = function (filter) {
  var facetA = filter.primary;
  var facetB = filter.secondary;
  var facetC = filter.tertiary;

  if (!facetA) facetA = new Facet({type: 'constant'});
  if (!facetC) facetC = facetB;
  if (!facetC) facetC = facetA;
  if (!facetB) facetB = new Facet({type: 'constant'});

  var query = squel
    .select()
    .from(DatabaseTable)
    .field(util.facetQuery(facetA).toString(), 'a')
    .field(util.facetQuery(facetB).toString(), 'b')
    .field(facetC.reduction + '(' + facetC.accessor + ')', 'c')
    .where(util.selectValid(facetA).toString())
    .where(util.selectValid(facetB).toString())
    .where(util.selectValid(facetC).toString())
    .group('a')
    .group('b');

  // Apply selections from all other filters
  dataset.filters.forEach(function (w) {
    if (w.getId() !== filter.getId()) {
      query.where(filterWhereClause(w));
    }
  });

  QueryAndCallBack(query, function (result) {
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
      row.a = facetA.groups.models[g].value;

      g = row.b > facetA.groups.length ? row.b - 2 : row.b - 1;
      row.b = facetB.groups.models[row.b - 1].value;

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
    io.emit('newdata-' + filter.getId(), rows);
  });
};

io.on('connection', function (socket) {
  console.log('Connecting to client');

  socket.on('scanData', function (f) {
    var query = squel.select().from(DatabaseTable).limit(1);

    console.log('client requests: scanData');
    QueryAndCallBack(query, scanAndReply);
  });

  // FIXME: unused, commented out
  // socket.on('sampleData', function (count) {
  //   var query = squel.select().from(DatabaseTable).limit(count)
  //
  //   console.log('client requests: sampleData')
  //
  //  var reply = function (result) {
  //    console.log('server pushes: sampleData')
  //    io.emit('sampleDdata', result.rows)
  //  }
  //  QueryAndCallBack(query, reply)
  // })

  socket.on('getdata', function (id) {
    console.log('client requests: getdata', id);
    var filter = dataset.filters.get(id);

    getDataAndReply(filter);
  });

  socket.on('disconnect', function () {
    console.log('Disconnecting from client');
  });

  socket.on('sync-facets', function (data) {
    console.log('client pushes: sync-facets');
    dataset.reset(data);
  });

  socket.on('sync-filters', function (data) {
    console.log('client pushes: sync-filters');
    dataset.filters.reset(data);
  });
});
