var View = require('ampersand-view');
var templates = require('../templates');
var app = require('ampersand-app');
var ConfigureFacetPage = require('../pages/configure-facet');

module.exports = View.extend({
  template: templates.includes.facetbaritem,
  derived: {
    ttId: {
      deps: ['model.id'],
      fn: function () {
        return this.model.id + '_tt';
      }
    },
    dndId: {
      deps: ['model.id'],
      fn: function () {
        return 'facet:' + this.model.id;
      }
    }
  },
  bindings: {
    'model.name': '[data-hook~="facet-bar-item-button"]',
    'ttId': [
      {
        type: 'attribute',
        hook: 'facet-bar-item-button',
        name: 'id'
      },
      {
        type: 'attribute',
        hook: 'tt',
        name: 'for'
      }
    ],
    'dndId': {
      type: 'attribute',
      hook: 'facet-bar-item',
      name: 'id'
    },
    'model.description': '[data-hook~=tt]'
  },
  events: {
    'click [data-hook~=facet-bar-item-button]': 'editFacet'
  },
  editFacet: function () {
    app.trigger('page', new ConfigureFacetPage({model: this.model, starttab: 'define'}));
  }
});
