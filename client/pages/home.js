var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');
var csv = require('csv');

var CrossfilterDataset = require('../models/dataset-client');
var ServerDataset = require('../models/dataset-server');

module.exports = PageView.extend({
  pageTitle: 'home',
  template: templates.pages.home,
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

    reader.onload = function (evt) {
      var data = JSON.parse(evt.target.result);
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

    reader.onerror = function (evt) {
      console.error('Error', evt);
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
    // hack to get rid of 'Uncaught TypeError' in try-catch
    var self = this;
    // reading operation is successfully completed
    reader.onload = function (evt) {
      // TODO: check the file before upload.
      // If big files of different formats are uploaded,
      // it may be a problem.
      try {
        var json = JSON.parse(evt.target.result);
          // Tag the data with the dataURL
        json.forEach(function (d) {
          d.dataURL = dataURL;
        });
        app.me.dataset.crossfilter.add(json);
        self.showUploadSnack(dataURL + ' was uploaded succesfully!', '#008000');

        // automatically analyze dataset
        if (doScan) {
          app.me.dataset.scanData();
        }
      } catch (e) {
        console.error('Error parsing JSON file.', e);
        self.showUploadSnack('JSON file parsing problem! Please check the uploaded file.', '#D91035');
      }
    };

    reader.onerror = function (evt) {
      console.error('Error loading the JSON file.', evt);
      this.showUploadSnack('File loading problem!', '#D91035');
    };

    this.showUploadSnack('Loading file', '#008000');
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
    // hack to get rid of 'Uncaught TypeError' in try-catch
    var self = this;
    // reading operation is successfully completed
    reader.onload = function (evt) {
      csv.parse(evt.target.result, function (err, data) {
        if (err) {
          console.warn(err.message);
          self.showUploadSnack('CSV file parsing problem! Please check the uploaded file.', '#D91035');
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
          self.showUploadSnack(dataURL + ' was uploaded succesfully!', '#008000');

          // automatically analyze dataset
          if (doScan) {
            app.me.dataset.scanData();
          }
        }
      });
    };

    reader.onerror = function (evt) {
      console.error('Error loading CSV file.', evt);
      this.showUploadSnack('File loading problem!', '#D91035');
    };

    this.showUploadSnack('Loading file', '#008000');
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
      app.me.dataset.scanData();
    }
  },
  showUploadSnack: function (snackText, color) {
    var snackbarContainer = this.queryByHook('fileUploadSnack');
    var snackData = {message: snackText};

    snackbarContainer.MaterialSnackbar.textElement_.style.backgroundColor = color;
    snackbarContainer.MaterialSnackbar.showSnackbar(snackData);
    console.log(snackText);
  }
});
