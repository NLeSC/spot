var View = require('ampersand-view');
var templates = require('../../templates');
var app = require('ampersand-app');

module.exports = View.extend({
  template: templates.analyze.facetbarItem,
  derived: {
    dndId: {
      deps: ['model.id'],
      fn: function () {
        return 'facet:' + this.model.id;
      }
    }
  },
  bindings: {
    'model.name': '[data-hook~="facet-bar-item-button"]',
    'dndId': {
      type: 'attribute',
      hook: 'facet-bar-item',
      name: 'id'
    }
  },
  events: {
    'click [data-hook~=facet-bar-item-button]': 'editFacet'
  },
  editFacet: function () {
    app.navigate('facet/' + this.model.id);
  }
});
