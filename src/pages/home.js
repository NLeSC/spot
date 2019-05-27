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
  demoSessionOnline: function () {
    app.busy({enable: true});
    app.importRemoteSession('https://raw.githubusercontent.com/NLeSC/spot/master/dist/demo.json');
    app.busy({enable: false});}

});
