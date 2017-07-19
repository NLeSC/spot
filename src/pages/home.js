var PageView = require('./base');
var templates = require('../templates');

module.exports = PageView.extend({
  initialize: function () {
    this.pageName = 'home';
  },
  pageTitle: 'Home',
  template: templates.home,
  events: {

  }

});
