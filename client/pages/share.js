var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');

var CrossfilterDataset = require('../../framework/dataset/client');
var ServerDataset = require('../../framework/dataset/server');

module.exports = PageView.extend({
  pageTitle: 'Share',
  template: templates.share,
  events: {
    'click [data-hook~=session-download]': 'downloadSession',
    'change [data-hook~=session-upload-input]': 'uploadSession'
  },
  downloadSession: function () {
    var json = JSON.stringify(this.model.dataset.toJSON());
    var blob = new window.Blob([json], {type: 'application/json'});
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
      if (data.datasetType === 'server') {
        this.model.dataset = new ServerDataset(data);
      } else if (data.datasetType === 'client') {
        this.model.dataset = new CrossfilterDataset(data);
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
