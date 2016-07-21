var View = require('ampersand-view');
var templates = require('../templates');
var app = require('ampersand-app');
var ConfigureFacetPage = require('../pages/configure-facet');

module.exports = View.extend({
  template: templates.includes.facet,
  bindings: {
    'model.name': '[data-hook~=name]',
    'model.description': '[data-hook~=description]',
    'model.units': '[data-hook~=units]',
    'model.show': {
      type: 'toggle',
      hook: 'fullitem'
    },
    // turn on/off the facet
    'model.active': [
      {
        type: 'booleanClass',
        hook: 'description',
        yes: 'mdl-color-text--accent'
      }
    ]
  },
  events: {
    'click [data-hook~=power]': 'togglePower',
    'click [data-hook~=edit]': 'editFacet'
  },
  togglePower: function () {
    this.model.active = !this.model.active;
  },
  editFacet: function () {
    app.trigger('page', new ConfigureFacetPage({model: this.model}));
  }
});
