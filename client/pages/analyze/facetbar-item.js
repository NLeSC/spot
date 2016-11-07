var View = require('ampersand-view');
var templates = require('../../templates');
var app = require('ampersand-app');

module.exports = View.extend({
  template: templates.analyze.facetbarItem,
  bindings: {
    'model.name': '[data-hook~="facet-bar-item-button"]',
    'model.id': {
      type: 'attribute',
      hook: 'facet-bar-item',
      name: 'data-id'
    }
  },
  events: {
    'click [data-hook~=facet-bar-item-button]': 'editFacet'
  },
  editFacet: function () {
    app.navigate('facet/' + this.model.id);
  }
});
