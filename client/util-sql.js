var app = require('ampersand-app');
var socketIO = require('socket.io-client');

var connect = function () {
  var socket = socketIO('http://localhost:3080');

  socket.on('connect', function () {
    console.log('spot-server: connected');
    app.isConnected = true;
  });

  socket.on('disconnect', function () {
    console.log('spot-server: disconnected, trying to reconnect');
    app.isConnected = false;
  });

  socket.on('sync-facets', function (data) {
    console.log('spot-server: sync-facets');
    app.me.dataset.reset(data);
  });

  socket.on('sync-widgets', function (data) {
    console.log('spot-server: sync-widgets');
    app.me.widgets.reset(data);
  });

  console.log('spot-server: connecting');
  socket.connect();

  app.socket = socket;
};

module.exports = {
  connect: connect
};
