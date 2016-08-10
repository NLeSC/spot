var ConfigurePartitionPage = require('../pages/configure-partition');
var View = require('ampersand-view');
var templates = require('../templates');
var app = require('ampersand-app');

module.exports = View.extend({
  template: templates.includes.partitionButton,
  derived: {
    name: {
      deps: ['model.facetId'],
      fn: function () {
        var facet = app.me.dataset.facets.get(this.model.facetId);
        return facet.name;
      }
    }
  },
  bindings: {
    'name': {
      type: 'text',
      hook: 'button'
    }
  },
  events: {
    'click [data-hook~="button"]': 'configurePartition'
  },
  configurePartition: function () {
    app.trigger('page', new ConfigurePartitionPage({
      model: this.model
    }));
  }
});
