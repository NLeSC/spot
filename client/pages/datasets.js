var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');
var csv = require('csv');

var CrossfilterDataset = require('../../framework/dataset/client');
var ServerDataset = require('../../framework/dataset/server');
var DatasetCollectionView = require('./datasets/dataset-collection');

module.exports = PageView.extend({
  template: templates.datasets,
  events: {
    'change [data-hook~=json-upload-input]': 'uploadJSON',
    'change [data-hook~=csv-upload-input]': 'uploadCSV',
    'click [data-hook~=server-connect]': 'connectServer'
  },
  subviews: {
    datasets: {
      hook: 'dataset-items',
      constructor: DatasetCollectionView
    }
  },
  initialize: function () {
    this.on('remove', function () {
      // TODO: WIP: joining datasets not implemented yet
      if (app.me.datasets.length > 0) {
        // if nothing selected use first one
        app.me.dataset = app.me.datasets.models[0];

        // if more selected, use last selected
        app.me.datasets.models.forEach(function (dataset) {
          if (dataset.isActive) {
            app.me.dataset = dataset;
          }
        });
        app.message({
          text: 'Multiple datasets work in progress, now using only ' + app.me.dataset.name,
          type: 'ok'
        });
      }
    }, this);
  },
  uploadJSON: function () {
    var fileLoader = this.queryByHook('json-upload-input');
    var uploadedFile = fileLoader.files[0];
    var reader = new window.FileReader();
    var dataURL = fileLoader.files[0].name;

    var dataset = new CrossfilterDataset({
      name: dataURL,
      URL: dataURL,
      description: 'uploaded JSON file'
    });

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
        dataset.crossfilter.add(json);

        // automatically analyze dataset
        dataset.scanData();
        dataset.facets.forEach(function (facet, i) {
          if (i < 20) {
            facet.isActive = true;

            if (facet.isCategorial) {
              facet.setCategories();
            } else if (facet.isContinuous) {
              facet.setMinMax();
            } else if (facet.isTimeOrDuration) {
              facet.setMinMax();
            }
          }
        });
        app.message({
          text: dataURL + ' was uploaded succesfully. Configured ' + dataset.facets.length + ' facets',
          type: 'ok'
        });
        app.me.datasets.add(dataset);
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

    reader.readAsText(uploadedFile);
  },
  uploadCSV: function () {
    var fileLoader = this.queryByHook('csv-upload-input');
    var uploadedFile = fileLoader.files[0];
    var reader = new window.FileReader();
    var dataURL = fileLoader.files[0].name;

    var dataset = new CrossfilterDataset({
      name: dataURL,
      URL: dataURL,
      description: 'uploaded CSV file'
    });

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
          dataset.crossfilter.add(json);

          // automatically analyze dataset
          dataset.scanData();
          dataset.facets.forEach(function (facet, i) {
            if (i < 20) {
              facet.isActive = true;

              if (facet.isCategorial) {
                facet.setCategories();
              } else if (facet.isContinuous) {
                facet.setMinMax();
              } else if (facet.isTimeOrDuration) {
                facet.setMinMax();
              }
            }
          });
          app.message({
            text: dataURL + ' was uploaded succesfully. Configured ' + dataset.facets.length + ' facets',
            type: 'ok'
          });
          app.me.datasets.add(dataset);
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

    reader.readAsText(uploadedFile);
  },
  connectServer: function () {
    var doScan = false;

    // enforce server dataset
    if (this.model.dataset.datasetType !== 'server') {
      delete this.model.dataset;
      this.model.dataset = new ServerDataset();
      doScan = true;
    }
    var dataset = this.model.dataset;

    dataset.connect(window.location.hostname);

    // automatically analyze dataset
    if (doScan) {
      dataset.scanData();
      app.message({
        text: 'Configured ' + dataset.facets.length + ' facets',
        type: 'ok'
      });
    }
  }
});
