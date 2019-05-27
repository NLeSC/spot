var View = require('ampersand-view');
var templates = require('../../templates');
var app = require('ampersand-app');

var SessionView = require('./session-view');

module.exports = View.extend({
  template: templates.datasets.sessionCollection,
  initialize: function () {
  },
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(app.sessions, SessionView, this.queryByHook('session-collection-items'));
    return this;
  }
});
