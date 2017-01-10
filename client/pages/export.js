var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');

module.exports = PageView.extend({
  template: templates.export,
  events: {
    'click [data-hook~=json-download]': 'downloadJSON'
  },
  downloadJSON: function () {
    var data = app.me.exportClientData();

    var json = JSON.stringify(data);
    var blob = new window.Blob([json], {type: 'application/json'});
    var url = window.URL.createObjectURL(blob);

    var element = document.createElement('a');
    element.download = 'data.json';
    element.href = url;
    element.click();

    window.URL.revokeObjectURL(url);
  }
});
