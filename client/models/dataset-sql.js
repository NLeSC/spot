var Collection = require('ampersand-collection');
var SqlFacet = require('./facet-sql');
var app = require('ampersand-app');

// ********************************************************
// Dataset utility functions
// ********************************************************

// Draw a sample, and call a function with the sample as argument
function sampleData (count, cb) {
  var socket = app.socket;

  console.log('spot-server: sampleData');
  socket.emit('sampleData', count);

  socket.once('sampleData', function (data) {
    console.log('spot-server: receiving sampleData');
    cb(data);
  });
}

function scanData (dataset) {
  var socket = app.socket;

  console.log('spot-server: scanData');
  socket.emit('scanData');
}

// ********************************************************
// Data callback function
// ********************************************************

// General crosfilter function, takes three factes, and returns:
// { data: function () ->
//  [{
//      a: facetA.group(d),
//      b: facetB.group(d),
//      c: reduce( facetC )
//  },...]
//  dimension: crossfilter.dimension()
// }

function initDataFilter (widget) {
  var socket = app.socket;

  console.log('spot-server: sync-widgets');
  socket.emit('sync-widgets', app.me.widgets.toJSON());

  socket.on('newdata-' + widget.getId(), function (data) {
    if (data) {
      widget.data = data;
      widget.trigger('newdata');
      console.log('spot-server: newdata-' + widget.getId());
    } else {
      console.error('No data in response to getdata for widget ' + widget.getId());
    }
  });

  var id = widget.getId();
  widget.getData = function () {
    console.log('spot-server: getdata for widget ' + id);
    socket.emit('getdata', id);
  };
}

function releaseDataFilter (widget) {
  var socket = app.socket;

  socket.off('newdata-' + widget.getId());
  socket.emit('sync-widgets', app.me.widgets.toJSON());
}

function setDataFilter (widget) {
  var socket = app.socket;

  console.log('spot-server: sync-widgets');
  socket.emit('sync-widgets', app.me.widgets.toJSON());
}

module.exports = Collection.extend({
  model: SqlFacet,
  comparator: function (left, right) {
    return left.name.localeCompare(right.name);
  },

  initDataFilter: initDataFilter,
  releaseDataFilter: releaseDataFilter,
  setDataFilter: setDataFilter,
  sampleData: sampleData,
  scanData: function () {
    scanData(this);
  }
});
