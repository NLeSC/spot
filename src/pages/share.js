var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');

var FormData = require('form-data');

require('dotenv').config()
console.log(process.env)


module.exports = PageView.extend({
  initialize: function () {
    this.pageName = 'share';
    this.helpTemplate = '';
  },
  pageTitle: 'Share',
  template: templates.share,
  bindings: {
  },
  events: {
    'click [data-hook~=session-cloud-upload]': 'uploadCloudSession',
    'click [data-hook~=session-cloud-download]': 'showCloudDownloadInfo',
    'click [data-hook~=session-download]': 'downloadSession',
    'change [data-hook~=session-upload-input]': 'uploadSession',
    'click [data-hook~=data-download]': 'downloadData',

    'click [data-hook~=session-download-cloud-close-button]': 'closeCloudDownloadInfo',
    'click [data-hook~=session-download-cloud-get]': 'downloadCloudSession',
    'click [data-hook~=session-upload-cloud-close-button]': 'closeCloudUploadInfo'
  },
  showCloudUploadInfo: function () {
    var dialog = this.queryByHook('session-upload-cloud');
    dialog.showModal();
  },
  closeCloudUploadInfo: function () {
    var dialog = this.queryByHook('session-upload-cloud');
    dialog.close();
  },
  uploadCloudSession: function () {
    // TODO: move this function to spot.js
    var json = app.me.toJSON();
    if (app.me.sessionType === 'client') {
      app.me.datasets.forEach(function (dataset, i) {
        json.datasets[i].data = dataset.data;
      });
    }

    var sessionData = new window.Blob([JSON.stringify(json)], {type: 'application/json'});

    var shareLink = this.queryByHook('session-upload-cloud-link');
    var shareDirectLink = this.queryByHook('session-upload-cloud-link-direct');
    var xhr = new window.XMLHttpRequest();
    var formData = new FormData();
    xhr.open('POST', 'https://file.io', true);

    var that = this;
    console.log(app.AppRoot)
    xhr.onload = function () {
      var response = JSON.parse(this.responseText);
      if (response.success === true) {
        shareLink.value = response.link;
        shareDirectLink.value = process.env.BASE_URL + '#session=' + response.link;
        that.showCloudUploadInfo();
      } else {
        console.warn('Session upload problem!');
      }
    };

    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    formData.append('file', sessionData, 'session.json');
    xhr.send(formData);
  },
  showCloudDownloadInfo: function () {
    var dialog = this.queryByHook('session-download-cloud');
    dialog.showModal();
  },
  closeCloudDownloadInfo: function () {
    var dialog = this.queryByHook('session-download-cloud');
    dialog.close();
  },
  downloadCloudSession: function () {
    var sessionUrl = this.queryByHook('session-download-cloud-link').value;

    // TODO: verify the link
    if (sessionUrl !== '') {
      console.log('Downloading:', sessionUrl);
      this.closeCloudDownloadInfo();

      app.message({
        text: 'Downloading the session. Please wait.',
        type: 'ok'
      });

      app.downloadRemoteSession(sessionUrl);
    }
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
      app.loadSessionBlob(data);
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
