var View = require('ampersand-view');
var templates = require('../../templates');
var app = require('ampersand-app');

module.exports = View.extend({
  template: templates.analyze.facetbarItem,
  derived: {
    tooltipId: {
      deps: ['model.id'],
      fn: function () {
        return 'tooltip-' + this.model.id;
      }
    }
  },
  bindings: {
    'model.name': '[data-hook~="facet-bar-item-button"]',
    'model.id': {
      type: 'attribute',
      hook: 'facet-bar-item',
      name: 'data-id'
    },
    'tooltipId': [{
      type: 'attribute',
      hook: 'facet-bar-item',
      name: 'id'
    }, {
      type: 'attribute',
      hook: 'facet-bar-item-tooltip',
      name: 'for'
    }],
    'model.description': {
      type: 'text',
      hook: 'facet-bar-item-tooltip'
    }
  },
  events: {
    'click [data-hook~=facet-bar-item-button]': 'editFacet'
  },
  editFacet: function () {
    if (!app.me.isLockedDown) {
      app.navigate('facet/' + this.model.id);
    }
  }
});
