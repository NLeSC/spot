var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');
var csv = require('csv');

var CrossfilterDataset = require('../models/dataset-crossfilter');
var SqlDataset = require('../models/dataset-sql');
var utilsql = require('../util-sql');

module.exports = PageView.extend({
  pageTitle: 'home',
  template: templates.pages.home,
  events: {
    'click [data-hook~=session-download]': 'downloadSession',
    'change [data-hook~=session-upload-input]': 'uploadSession',
    'change [data-hook~=json-upload-input]': 'uploadJSON',
    'change [data-hook~=csv-upload-input]': 'uploadCSV',
    'click [data-hook~=sql-connect]': 'connectSQL'
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
      if (data.datasetType === 'sql') {
        app.me.dataset = new SqlDataset(data);
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

    // enforece crossfilter dataset
    if (app.me.dataset.datasetType !== 'crossfilter') {
      delete app.me.dataset;
      app.me.dataset = new CrossfilterDataset();
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
      } catch (e) {
        console.error('Error parsing JSON file.', e);
        self.showUploadSnack('JSON file parsing problem! Please check the uploaded file.', '#D91035');
      }
    };

    reader.onerror = function (evt) {
      console.error('Error loading the JSON file.', evt);
      this.showUploadSnack('File loading problem!', '#D91035');
    };

    reader.readAsText(uploadedFile);
  },
  uploadCSV: function () {
    var fileLoader = this.queryByHook('csv-upload-input');
    var uploadedFile = fileLoader.files[0];
    var reader = new window.FileReader();
    var dataURL = fileLoader.files[0].name;

    // enforece crossfilter dataset
    if (app.me.dataset.datasetType !== 'crossfilter') {
      delete app.me.dataset;
      app.me.dataset = new CrossfilterDataset();
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
        }
      });
    };

    reader.onerror = function (evt) {
      console.error('Error loading CSV file.', evt);
      this.showUploadSnack('File loading problem!', '#D91035');
    };

    reader.readAsText(uploadedFile);
  },
  connectSQL: function () {
    // enforece sql dataset
    if (app.me.dataset.datasetType !== 'sql') {
      delete app.me.dataset;
      app.me.dataset = new SqlDataset();
    }

    utilsql.connect();
  },
  showUploadSnack: function (snackText, color) {
    var snackbarContainer = this.queryByHook('fileUploadSnack');
    var snackData = {message: snackText};

    snackbarContainer.MaterialSnackbar.textElement_.style.backgroundColor = color;
    snackbarContainer.MaterialSnackbar.showSnackbar(snackData);
    console.log(snackText);
  }

});
