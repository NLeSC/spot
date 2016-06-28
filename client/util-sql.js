/**
 * Utility functions for SQL datasets
 * @module client/util-sql
 */
var socketIO = require('socket.io-client');
var squel = require('squel').useFlavour('postgres');
var misval = require('./misval');

function selectValid (facet) {
  var accessor = facet.accessor;
  var query = squel.expr();

  facet.misval.forEach(function (val) {
    if (val === null) {
      query.and(accessor + ' IS NOT NULL'); // FIXME document
    } else {
      if (facet.isCategorial) { // String valued facet
        query.and(accessor + " != '" + val + "'");
      } else if (facet.isContinuous) { // Number valued facet
        if (val && val === +val) {
          query.and(accessor + ' != ' + val);
        }
      }
    }
  });
  return query;
}

function facetQuery (facet) {
  if (facet.isConstant) {
    return "'1'";
  }

  // bins := {
  //    label: <string>                          text for display
  //    group: <string> || [<number>, <number>]  domain of this grouping
  //    value: <string> || <number>              a value guaranteed to be in this group
  // }
  var accessor = facet.accessor;
  var bins = facet.bins();
  var query = squel.case();

  bins.forEach(function (bin, i) {
    var b = squel.expr();
    if (facet.displayContinuous) {
      if (i === bins.length - 1) {
        // Assign maximum value to the last bin
        b
          .and(accessor + '>=' + bin.group[0])
          .and(accessor + '<=' + bin.group[1]);
      } else {
        // Assign lower limit of interval to the bin
        b
          .and(accessor + '>=' + bin.group[0])
          .and(accessor + '<' + bin.group[1]);
      }
    } else if (facet.displayCategorial) {
      b
        .and(accessor + '=' + bin.group[0]);
    }
    query
      .when(b.toString())
      .then(bin.label);
  });

  if (facet.displayContinuous) {
    var last = bins.length - 1;
    query.when(accessor + '=' + bins[last].group[1]).then(bins[last].label);
  }

  // Return missing value in all other cases
  query.else(misval);

  return query;
}

/** Connect to the spot-server using a websocket on port 3080. */
function connect (dataset) {
  var socket = socketIO('http://localhost:3080');

  socket.on('connect', function () {
    console.log('spot-server: connected');
    dataset.isConnected = true;
  });

  socket.on('disconnect', function () {
    console.log('spot-server: disconnected, trying to reconnect');
    dataset.isConnected = false;
  });

  socket.on('sync-facets', function (data) {
    console.log('spot-server: sync-facets');
    dataset.facets.reset(data);
  });

  socket.on('sync-filters', function (data) {
    console.log('spot-server: sync-filters');
    dataset.filters.reset(data);
  });

  console.log('spot-server: connecting');
  socket.connect();

  dataset.socket = socket;
}

module.exports = {
  connect: connect,
  selectValid: selectValid,
  facetQuery: facetQuery
};
