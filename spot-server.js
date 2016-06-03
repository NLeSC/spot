'use strict';

var SqlDataset = require('./client/models/dataset-sql');
var Widgets = require('./client/models/widget-collection');
var util = require('./client/util');

var io = require('socket.io')(3080);
var pg = require('pg');
pg.defaults.poolSize = 75; // SHOW max_connections

var squel = require('squel').useFlavour('postgres');

// TODO: make this configurable
var conString = 'postgres://jiska:postgres@localhost/jiska';
var DatabaseTable = 'buurtonly';

var dataset = new SqlDataset();
var widgets = new Widgets();

var scanAndReply = function (data) {
  var nfields = data.fields.length;

  // remove previous facets
  dataset.reset();

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
        dataset.add({
          name: name,
          accessor: name,
          type: 'continuous',
          minvalAsText: result.rows[0].min,
          maxvalAsText: result.rows[0].max,
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
        dataset.add({
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

var widgetWhereClause = function (widget) {
  var where = '';
  if (!widget.primary) {
    console.error('No primary facet for widget', widget.toString());
    return '';
  }

  var accessor = widget.primary.accessor;

  if (widget.selection && widget.selection.length > 0) {
    where = squel.expr();
    if (widget.primary.displayCategorial) {
      // categorial
      widget.selection.forEach(function (group) {
        where.and(accessor + ' = ' + group);
      });
    } else if (widget.primary.displayContinuous) {
      // continuous
      where.and(accessor + '>=' + widget.selection[0]);
      where.and(accessor + '<' + widget.selection[1]);
    }
  }

  return where;
};

var getDataAndReply = function (widget) {
  var facetA = widget.primary;
  var facetB = widget.secondary;
  var facetC = widget.tertiary;

  if (!facetA) facetA = util.unitFacet;
  if (!facetC) facetC = facetB;
  if (!facetC) facetC = facetA;
  if (!facetB) facetB = util.unitFacet;

  var query = squel
    .select()
    .from(DatabaseTable)
    .field(facetA.field.toString(), 'a')
    .field(facetB.field.toString(), 'b')
    .field(facetC.reduction + '(' + facetC.accessor + ')', 'c')
    .where(facetA.valid.toString())
    .where(facetB.valid.toString())
    .where(facetC.valid.toString())
    .group('a')
    .group('b');

  // Apply selections from all other widgets
  widgets.forEach(function (w) {
    if (w.getId() !== widget.getId()) {
      query.where(widgetWhereClause(w));
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

    // re-format the data
    rows.forEach(function (row) {
      if (facetC.reducePercentage) {
        if (facetB === util.unitFacet) {
          // no subgroups, normalize wrt. the full total
          row.c = 100.0 * row.c / fullTotal;
        } else {
          // we have subgroups, normalize wrt. the subgroup
          row.c = 100.0 * row.c / groupTotals[row.a];
        } }
    });
    io.emit('newdata-' + widget.getId(), rows);
  });
};

io.on('connection', function (socket) {
  console.log('Connecting to client');

  socket.on('scanData', function (f) {
    var query = squel.select().from(DatabaseTable).limit(1);

    console.log('client requests: scanData');
    QueryAndCallBack(query, scanAndReply);
  });

  socket.on('sampleData', function (count) {
    var query = squel.select().from(DatabaseTable).limit(count);

    console.log('client requests: sampleData');

    var reply = function (result) {
      console.log('server pushes: sampleData');
      io.emit('sampleDdata', result.rows);
    };
    QueryAndCallBack(query, reply);
  });

  socket.on('getdata', function (id) {
    console.log('client requests: getdata', id);
    var widget = widgets.get(id);

    getDataAndReply(widget);
  });

  socket.on('disconnect', function () {
    console.log('Disconnecting from client');
  });

  socket.on('sync-facets', function (data) {
    console.log('client pushes: sync-facets');
    dataset.reset(data);
  });

  socket.on('sync-widgets', function (data) {
    console.log('client pushes: sync-widgets');
    widgets.reset(data);
  });
});
