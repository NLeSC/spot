var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');

module.exports = PageView.extend({
  initialize: function () {
    this.pageName = 'home';
    this.helpTemplate = '';
    app.detectMobile();
    app.startWelcome();
  },
  pageTitle: 'Home',
  template: templates.home,
  events: {
    'click [data-hook~=demo-session]': 'demoSessionOnline'
  },
  bindings: {

  },

  renderContent: function () {

  },
  demoSessionLocal: function () {
    app.busy(true);
    const $ = window.$;
    $.getJSON('./demo.json', function (data) {
      app.loadSessionBlob(data);
    });
    app.busy(false);
  },
  demoSessionOnline: function () {
    app.busy(true);
    app.downloadRemoteSession('https://raw.githubusercontent.com/NLeSC/spot/master/dist/demo.json');
    app.busy(false);
  }

});
