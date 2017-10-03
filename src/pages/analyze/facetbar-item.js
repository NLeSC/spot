var View = require('ampersand-view');
var templates = require('../../templates');
var app = require('ampersand-app');
var $ = require('jquery');

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
    'click [data-hook~=facet-bar-item-button]': 'editFacet',
    'mouseenter': 'enter'
  },
  editFacet: function () {
    if (!app.me.isLockedDown) {
      app.navigate('facet/' + this.model.id);
    }
  },
  enter: function (e) {
    var tip = document.getElementById('facet-bar-tooltip');
    if (tip) {
      tip.innerHTML = this.model.description;
      // Position the tooltip below the mouse pointer
      $('#facet-bar-tooltip').css('left', e.pageX);
    }
  }
});
