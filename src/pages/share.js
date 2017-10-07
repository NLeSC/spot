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
    var json = app.me.toJSON();
    if (app.me.sessionType === 'client') {
      app.me.datasets.forEach(function (dataset, i) {
        json.datasets[i].data = dataset.data;
      });
    }
    var sessionData = new window.Blob([JSON.stringify(json)], {type: 'application/json'});

    var shareLink = this.queryByHook('session-upload-cloud-link');
    var shareExpire = this.queryByHook('session-upload-cloud-expire');
    var xhr = new window.XMLHttpRequest();
    var formData = new FormData();
    xhr.open('POST', 'https://file.io', true);

    var that = this;
    xhr.onload = function () {
      var response = JSON.parse(this.responseText);
      console.log(response);
      if (response.success === true) {
        console.log(response.expiry);
        shareLink.value = response.link;
        shareExpire.value = response.expiry;
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
    var sessionLink = this.queryByHook('session-download-cloud-link').value;

    // TODO verify the link
    if (sessionLink !== '') {
      console.log('Downloading:', sessionLink);
      this.closeCloudDownloadInfo();

      app.message({
        text: 'Downloading the session. Please wait.',
        type: 'ok'
      });

      // TODO: switch to node-fetch
      var getJSON = function (url, callback) {
        var xhr = new window.XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'json';
        xhr.onload = function () {
          var status = xhr.status;
          if (status === 200) {
            callback(null, xhr.response);
          } else {
            callback(status, xhr.response);
          }
        };
        xhr.send();
      };

      getJSON(sessionLink,
      function (err, data) {
        if (err !== null) {
          window.alert('Something went wrong: ' + err);
        } else {
          app.me = new Spot(data);

          if (data.sessionType === 'server') {
            app.me.connectToServer(data.address);
          } else if (data.sessionType === 'client') {
            // add data from the session file to the dataset
            data.datasets.forEach(function (d, i) {
              app.me.datasets.models[i].crossfilter.add(d.data);
              app.me.datasets.models[i].isActive = false; // we'll turn it on later
            });

            data.datasets.forEach(function (d, i) {
              if (d.isActive) {
                app.me.toggleDataset(app.me.datasets.models[i]);
              }
            });
          }

          app.message({
            text: 'Demo session was started succesfully',
            type: 'ok'
          });

          // and automatically go to the analyze page
          app.navigate('/analyze');
        }
      });
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
