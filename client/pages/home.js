var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');
var csv = require('csv');

var CrossfilterDataset = require('../../framework/dataset/client');
var ServerDataset = require('../../framework/dataset/server');

module.exports = PageView.extend({
  pageTitle: 'home',
  template: templates.home,
  events: {
    'click [data-hook~=session-download]': 'downloadSession',
    'change [data-hook~=session-upload-input]': 'uploadSession',
    'change [data-hook~=json-upload-input]': 'uploadJSON',
    'change [data-hook~=csv-upload-input]': 'uploadCSV',
    'click [data-hook~=server-connect]': 'connectServer'
  },
  downloadSession: function () {
    var json = JSON.stringify(app.me.dataset.toJSON());
    var blob = new window.Blob([json], {type: 'application/json'});
    var url = window.URL.createObjectURL(blob);

    var a = this.queryByHook('session-download');
    a.download = 'session.json';
    a.href = url;

  // FIXME: life cycle of the object url
  // var objectURL = window.URL.createObjectURL(fileObj)
  // window.URL.revokeObjectURL(objectURL)
  },
  uploadSession: function () {
    var fileLoader = this.queryByHook('session-upload-input');
    var uploadedFile = fileLoader.files[0];
    var reader = new window.FileReader();

    reader.onload = function (ev) {
      var data = JSON.parse(ev.target.result);
      if (data.datasetType === 'server') {
        app.me.dataset = new ServerDataset(data);
      } else if (data.datasetType === 'crossfilter') {
        app.me.dataset = new CrossfilterDataset(data);
      }

      // initialize filters
      app.me.dataset.filters.forEach(function (filter) {
        app.me.dataset.initDataFilter(app.me.dataset, filter);
        app.me.dataset.updateDataFilter(app.me.dataset, filter);
      });
    };

    reader.onerror = function (ev) {
      console.error('Error', ev);
    };

    reader.readAsText(uploadedFile);
  },
  uploadJSON: function () {
    var fileLoader = this.queryByHook('json-upload-input');
    var uploadedFile = fileLoader.files[0];
    var reader = new window.FileReader();
    var dataURL = fileLoader.files[0].name;
    var doScan = false;

    // enforece crossfilter dataset
    if (app.me.dataset.datasetType !== 'crossfilter') {
      delete app.me.dataset;
      app.me.dataset = new CrossfilterDataset();
      doScan = true;
    }
    // reading operation is successfully completed
    reader.onload = function (ev) {
      // TODO: check the file before upload.
      // If big files of different formats are uploaded,
      // it may be a problem.
      try {
        var json = JSON.parse(ev.target.result);
        // Tag the data with the dataURL
        json.forEach(function (d) {
          d.dataURL = dataURL;
        });
        app.me.dataset.crossfilter.add(json);
        app.message({
          text: dataURL + ' was uploaded succesfully!',
          type: 'ok'
        });

        // automatically analyze dataset
        if (doScan) {
          app.message({
            text: 'Scanning dataset',
            type: 'info'
          });
          app.me.dataset.scanData();
          app.message({
            text: 'Configured ' + app.me.dataset.facets.length + ' facets',
            type: 'ok'
          });
        }
      } catch (ev) {
        app.message({
          text: 'JSON file parsing problem! Please check the uploaded file.',
          type: 'error',
          error: ev
        });
      }
    };

    reader.onerror = function (ev) {
      app.message({
        text: 'File loading problem!',
        type: 'error',
        error: ev
      });
    };

    app.message({
      text: 'Loading file',
      type: 'info'
    });
    reader.readAsText(uploadedFile);
  },
  uploadCSV: function () {
    var fileLoader = this.queryByHook('csv-upload-input');
    var uploadedFile = fileLoader.files[0];
    var reader = new window.FileReader();
    var dataURL = fileLoader.files[0].name;
    var doScan = false;

    // enforece crossfilter dataset
    if (app.me.dataset.datasetType !== 'crossfilter') {
      delete app.me.dataset;
      app.me.dataset = new CrossfilterDataset();
      doScan = true;
    }
    // reading operation is successfully completed
    reader.onload = function (ev) {
      csv.parse(ev.target.result, function (err, data) {
        if (err) {
          console.warn(err.message);
          app.message({
            text: 'CSV file parsing problem! Please check the uploaded file',
            type: 'error',
            error: ev
          });
        } else {
          // Tag the data with the dataURL
          var i;
          var j;
          var json = [];

          for (i = 0; i < data.length; i++) {
            var record = {};
            for (j = 0; j < data[i].length; j++) {
              record[j] = data[i][j];
            }
            record.dataURL = dataURL;
            json.push(record);
          }
          app.me.dataset.crossfilter.add(json);
          app.message({
            text: dataURL + ' was uploaded succesfully!',
            type: 'ok'
          });

          // automatically analyze dataset
          if (doScan) {
            app.message({
              text: 'Scanning dataset',
              type: 'info'
            });
            app.me.dataset.scanData();
            app.message({
              text: 'Configured ' + app.me.dataset.facets.length + ' facets',
              type: 'ok'
            });
          }
        }
      });
    };

    reader.onerror = function (ev) {
      console.warn('Error loading CSV file.', ev);
      app.message({
        text: 'File loading problem!',
        type: 'error'
      });
    };

    app.message({
      text: 'Loading file',
      type: 'info'
    });
    reader.readAsText(uploadedFile);
  },
  connectServer: function () {
    var doScan = false;

    // enforce server dataset
    if (app.me.dataset.datasetType !== 'server') {
      delete app.me.dataset;
      app.me.dataset = new ServerDataset();
      doScan = true;
    }

    app.me.dataset.connect();

    // automatically analyze dataset
    if (doScan) {
      app.message({
        text: 'Scanning dataset',
        type: 'info'
      });
      app.me.dataset.scanData();
      app.message({
        text: 'Configured ' + app.me.dataset.facets.length + ' facets',
        type: 'ok'
      });
    }
  }
});
