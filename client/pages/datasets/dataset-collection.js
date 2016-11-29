var View = require('ampersand-view');
var templates = require('../../templates');
var app = require('ampersand-app');

var DatasetView = require('./dataset');

module.exports = View.extend({
  template: templates.datasets.datasetCollection,
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(app.me.datasets, DatasetView, this.queryByHook('items'));
    return this;
  },
  bindings: {
    'model.name': {
      hook: 'name',
      type: 'text'
    }
  }
});
