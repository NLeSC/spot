// The PostgreSQL dataset, impelementing the Dataset interface
var Collection = require('ampersand-collection');
var app = require('ampersand-app');
var Facet = require('./facet');

function setMinMaxMissing (facet) {
  console.warn('setMinMaxMissing() not implemented for sql datasets');
}

function setCategories (facet) {
  console.warn('setCategories() not implemented for sql datasets');
}

function scanData () {
  var socket = app.socket;

  console.log('spot-server: scanData');
  socket.emit('scanData');
}

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

function updateDataFilter (widget) {
  var socket = app.socket;

  console.log('spot-server: sync-widgets');
  socket.emit('sync-widgets', app.me.widgets.toJSON());
}

module.exports = Collection.extend({
  model: Facet,
  comparator: function (left, right) {
    return left.name.localeCompare(right.name);
  },

  initDataFilter: initDataFilter,
  releaseDataFilter: releaseDataFilter,
  updateDataFilter: updateDataFilter,

  setCategories: setCategories,
  setMinMaxMissing: setMinMaxMissing,

  scanData: scanData
});
