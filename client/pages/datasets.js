var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');
var csv = require('csv');

var ClientDataset = require('../../framework/dataset/client');
var DatasetCollectionView = require('./datasets/dataset-collection');

module.exports = PageView.extend({
  template: templates.datasets,
  initialize: function () {
    this.pageName = 'datasets';
  },
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
  uploadJSON: function () {
    var fileLoader = this.queryByHook('json-upload-input');
    var uploadedFile = fileLoader.files[0];
    var reader = new window.FileReader();
    var dataURL = fileLoader.files[0].name;

    // enforce client dataset
    if (this.model.dataview.datasetType !== 'client') {
      delete this.model.dataview;
      this.model.dataview = new ClientDataset();
    }

    var dataset = new ClientDataset({
      name: dataURL,
      URL: dataURL,
      description: 'uploaded JSON file'
    });

    reader.onload = function (ev) {
      try {
        var json = JSON.parse(ev.target.result);
        dataset.crossfilter.add(json);

        // automatically analyze dataset
        dataset.scanData();
        dataset.facets.forEach(function (facet, i) {
          if (i < 20) {
            facet.isActive = true;

            if (facet.isCategorial) {
              facet.setCategories();
            } else if (facet.isContinuous || facet.isDatetime || facet.isDuration) {
              facet.setMinMax();
            }
          }
        });
        app.message({
          text: dataURL + ' was uploaded succesfully. Configured ' + dataset.facets.length + ' facets',
          type: 'ok'
        });
        app.me.datasets.add(dataset);
        window.componentHandler.upgradeDom();
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

    // enforce client dataset
    if (this.model.dataview.datasetType !== 'client') {
      delete this.model.dataview;
      this.model.dataview = new ClientDataset();
    }

    var dataset = new ClientDataset({
      name: dataURL,
      URL: dataURL,
      description: 'uploaded CSV file'
    });

    reader.onload = function (ev) {
      var options = {
        columns: true, // treat first line as header with column names
        relax_column_count: false, // accept malformed lines
        comment: '' // Treat all the characters after this one as a comment.
      };

      csv.parse(ev.target.result, options, function (err, data) {
        if (err) {
          console.warn(err.message);
          app.message({
            text: 'CSV file parsing problem! Please check the uploaded file',
            type: 'error',
            error: ev
          });
        } else {
          dataset.crossfilter.add(data);

          // automatically analyze dataset
          dataset.scanData();
          dataset.facets.forEach(function (facet, i) {
            if (i < 20) {
              facet.isActive = true;

              if (facet.isCategorial) {
                facet.setCategories();
              } else if (facet.isContinuous || facet.isDatetime || facet.isDuration) {
                facet.setMinMax();
              }
            }
          });
          app.message({
            text: dataURL + ' was uploaded succesfully. Configured ' + dataset.facets.length + ' facets',
            type: 'ok'
          });
          app.me.datasets.add(dataset);
          window.componentHandler.upgradeDom();
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
    app.me.connectToServer(window.location.hostname);
    app.me.socket.emit('getDatasets');
    app.message({
      text: 'Connected to  ' + window.location.hostname,
      type: 'ok'
    });
  }
});
