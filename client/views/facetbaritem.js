var View = require('ampersand-view');
var templates = require('../templates');

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
        hook: 'facet-bar-item',
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
      hook: 'facet-bar-item-button',
      name: 'id'
    },
    'model.description': '[data-hook~=tt]'
  }
});
