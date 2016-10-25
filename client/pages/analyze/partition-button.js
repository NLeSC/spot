var View = require('ampersand-view');
var templates = require('../../templates');
var app = require('ampersand-app');

module.exports = View.extend({
  template: templates.analyze.partitionButton,
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
      hook: 'chip-text'
    }
  },
  events: {
    'click [data-hook~="chip"]': 'configurePartition'
  },
  configurePartition: function () {
    var filter = this.model.collection.parent;
    app.navigate('filter/' + filter.id + '/' + this.model.rank);
  }
});
