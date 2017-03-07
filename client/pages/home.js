var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');

var ClientDataset = require('../../framework/dataset/client');

module.exports = PageView.extend({
  initialize: function () {
    this.pageName = 'home';
  },
  pageTitle: 'Home',
  template: templates.home,
  events: {

  }

});
