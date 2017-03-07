var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');
var csv = require('csv');

module.exports = PageView.extend({
  template: templates.export,
  initialize: function () {
    this.pageName = 'export';
  },
  events: {
    'click [data-hook~=json-download]': 'downloadJSON',
    'click [data-hook~=csv-download]': 'downloadCSV'
  },
  downloadCSV: function () {
    var data = app.me.dataview.exportData();
    var options = {
      header: true,
      quote: false
    };

    csv.stringify(data, options, function (err, output) {
      if (err) {
        console.error(err);
      } else {
        var blob = new window.Blob([output], {type: 'application/txt'});
        var url = window.URL.createObjectURL(blob);

        var element = document.createElement('a');
        element.download = 'data.csv';
        element.href = url;
        element.click();

        window.URL.revokeObjectURL(url);
      }
    });
  },
  downloadJSON: function () {
    var data = app.me.dataview.exportData();

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
