var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');

var ClientDataset = require('../../framework/dataset/client');

module.exports = PageView.extend({
  pageTitle: 'Share',
  template: templates.share,
  events: {
    'click [data-hook~=session-download]': 'downloadSession',
    'change [data-hook~=session-upload-input]': 'uploadSession'
  },
  downloadSession: function () {
    var json = app.me.toJSON();

    if (app.me.dataset.datasetType === 'client') {
      // for client datasets, also save the data in the session file
      app.me.datasets.forEach(function (dataset, i) {
        json.datasets[i].data = dataset.crossfilter.all();
      });
    }
    var blob = new window.Blob([JSON.stringify(json)], {type: 'application/json'});
    var url = window.URL.createObjectURL(blob);

    var element = document.createElement('a');
    element.download = 'session.json';
    element.href = url;
    element.click();

    window.URL.revokeObjectURL(url);
  },
  uploadSession: function () {
    var fileLoader = this.queryByHook('session-upload-input');
    var uploadedFile = fileLoader.files[0];
    var reader = new window.FileReader();

    reader.onload = function (ev) {
      var data = JSON.parse(ev.target.result);

      if (data.dataset.datasetType === 'server') {
        app.me.connectToServer(data.address); // this also creates a new me.dataset of type 'server'
        app.me.dataset.databaseTable = data.dataset.databaseTable;
        app.me.dataset.facets.reset(data.dataset.facets);
        app.me.dataset.filters.reset(data.dataset.filters);
        app.me.datasets.reset(data.datasets);
      } else if (data.dataset.datasetType === 'client') {
        app.me.dataset = new ClientDataset(data.dataset);
        app.me.datasets.reset(data.datasets);

        // add data from the session file to the dataset
        data.datasets.forEach(function (d, i) {
          app.me.datasets.models[i].crossfilter.add(d.data);
          app.me.datasets.models[i].isActive = false; // we'll turn it on later
        });

        // merge all the data into the app.me.dataset
        // by toggling the active datasets back on
        data.datasets.forEach(function (d, i) {
          if (d.isActive) {
            app.me.toggleDataset(app.me.datasets.models[i]);
          }
        });
      } else {
        console.error('Session not supported');
      }

      app.message({
        text: 'Session "' + uploadedFile.name + '" was uploaded succesfully',
        type: 'ok'
      });
    };

    reader.onerror = function (ev) {
      app.message({
        text: 'Could not load Session "' + uploadedFile.name + '"',
        type: 'error',
        error: ev
      });
    };

    reader.readAsText(uploadedFile);
  }
});
