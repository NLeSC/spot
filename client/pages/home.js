var PageView = require('./base');
var templates = require('../templates');

module.exports = PageView.extend({
  template: templates.home,
  autoRender: true,
  initialize: function () {
    this.pageName = 'home';
  },
  pageTitle: 'Home',
  events: {

  },
  render: function () {
    this.renderWithTemplate(this);
  }
});
