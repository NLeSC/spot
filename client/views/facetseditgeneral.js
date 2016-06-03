var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
  template: templates.includes.facetseditgeneral,
  bindings: {
    'model.name': {
      type: 'value',
      hook: 'general-title-input'
    },
    'model.units': {
      type: 'value',
      hook: 'general-units-input'
    },
    'model.description': {
      type: 'value',
      hook: 'general-description-input'
    }
  },
  events: {
    'change [data-hook~=general-title-input]': function () {
      this.model.name = this.queryByHook('general-title-input').value;
    },
    'change [data-hook~=general-units-input]': function () {
      this.model.units = this.queryByHook('general-units-input').value;
    },
    'change [data-hook~=general-description-input]': function () {
      this.model.description = this.queryByHook('general-description-input').value;
    }
  }
});
