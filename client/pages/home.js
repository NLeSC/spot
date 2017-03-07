var PageView = require('./base');
// var templates = require('../templates');

module.exports = PageView.extend({
  initialize: function () {
    this.pageName = 'home';
  },
  template: '<h1> SPOT - extensible facet browser </h1>'
});
