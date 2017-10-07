var Spot = require('spot-framework');
var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');

var FormData = require('form-data');

module.exports = PageView.extend({
  initialize: function () {
    this.pageName = 'share';
  },
  pageTitle: 'Share',
  template: templates.share,
  bindings: {
    'infoLabel': {
      type: 'value',
      hook: 'share-info-link'
    }
  },
  events: {
    'click [data-hook~=session-cloud-upload]': 'uploadCloudSession',
    'click [data-hook~=session-download]': 'downloadSession',
    'change [data-hook~=session-upload-input]': 'uploadSession',
    'click [data-hook~=data-download]': 'downloadData',

    'click [data-hook~=share-info-close-button]': 'closeShareInfo'
  },

  showShareInfo: function () {
    var dialog = this.queryByHook('share-info-dialog');
    dialog.showModal();
  },
  closeShareInfo: function () {
    var dialog = this.queryByHook('share-info-dialog');
    dialog.close();
  },
  uploadCloudSession: function () {
    var json = app.me.toJSON();
    if (app.me.sessionType === 'client') {
      app.me.datasets.forEach(function (dataset, i) {
        json.datasets[i].data = dataset.data;
      });
    }
    var sessionData = new window.Blob([JSON.stringify(json)], {type: 'application/json'});

    var infoLabel = this.queryByHook('share-info-link');
    var xhr = new window.XMLHttpRequest();
    var formData = new FormData();
    xhr.open('POST', 'https://file.io', true);

    var that = this;
    xhr.onload = function () {
      var response = JSON.parse(this.responseText);
      console.log(response);
      if (response.success === true) {
        console.log(response.expiry);
        infoLabel.value = response.link;
        that.showShareInfo();
      } else {
        console.warn('Session upload problem!');
      }
    };

    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    formData.append('file', sessionData, 'session.json');
    xhr.send(formData);
  },
  downloadSession: function () {
    var json = app.me.toJSON();

    if (app.me.sessionType === 'client') {
      // for client datasets, also save the data in the session file
      app.me.datasets.forEach(function (dataset, i) {
        json.datasets[i].data = dataset.data;
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
  downloadData: function () {
    var chartsData = [];

    var partitionRankToName = {1: 'a', 2: 'b', 3: 'c', 4: 'd'};
    var aggregateRankToName = {1: 'aa', 2: 'bb', 3: 'cc', 4: 'dd', 5: 'ee'};

    app.me.dataview.filters.forEach(function (filter) {
      var map = {};
      var axis = [];
      filter.partitions.forEach(function (partition) {
        map[partitionRankToName[partition.rank]] = partition.facetName;
        axis.push(partition.facetName);
      });
      filter.aggregates.forEach(function (aggregate) {
        map[aggregateRankToName[aggregate.rank]] = aggregate.operation + ' ' + aggregate.facetName;
      });
      map['count'] = 'count';

      var data = [];
      filter.data.forEach(function (d) {
        var mapped = {};
        Object.keys(d).forEach(function (k) {
          if (map[k]) {
            mapped[map[k]] = d[k];
          }
        });
        data.push(mapped);
      });
      chartsData.push({
        chartType: filter.chartType,
        axis: axis.join(','),
        data: data
      });
    });

    var blob = new window.Blob([JSON.stringify(chartsData)], {type: 'application/json'});
    var url = window.URL.createObjectURL(blob);

    var element = document.createElement('a');
    element.download = 'data.json';
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
      app.me = new Spot(data);

      if (data.sessionType === 'server') {
        app.me.connectToServer(data.address);
      } else if (data.sessionType === 'client') {
        // add data from the session file to the dataset
        data.datasets.forEach(function (d, i) {
          app.me.datasets.models[i].crossfilter.add(d.data);
          app.me.datasets.models[i].isActive = false; // we'll turn it on later
        });

        // merge all the data into the app.me.dataview
        // by toggling the active datasets back on
        data.datasets.forEach(function (d, i) {
          if (d.isActive) {
            app.me.toggleDataset(app.me.datasets.models[i]);
          }
        });
      }

      app.message({
        text: 'Session "' + uploadedFile.name + '" was uploaded succesfully',
        type: 'ok'
      });

      // and automatically go to the analyze page
      app.navigate('analyze');
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
