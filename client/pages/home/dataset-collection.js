var View = require('ampersand-view');
var templates = require('../../templates');
var app = require('ampersand-app');

var DatasetView = require('./dataset');

module.exports = View.extend({
  template: templates.home.datasetCollection,
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(app.me.datasets, DatasetView, this.queryByHook('items'));

    window.componentHandler.upgradeDom(this.el);
    return this;
  },
  bindings: {
    'model.name': {
      hook: 'name',
      type: 'text'
    }
  },
  events: {
  }
});
