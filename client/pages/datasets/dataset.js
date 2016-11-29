var View = require('ampersand-view');
var templates = require('../../templates');

module.exports = View.extend({
  template: templates.datasets.dataset,
  derived: {
    facetsURL: {
      deps: ['model.id'],
      fn: function () {
        return '/dataset/' + this.model.id;
      }
    }
  },
  bindings: {
    'model.name': {
      hook: 'name',
      type: 'text'
    },
    'model.description': {
      hook: 'description',
      type: 'text'
    },
    'facetsURL': {
      hook: 'name',
      type: 'attribute',
      name: 'href'
    },
    'model.isActive': {
      hook: 'checkbock',
      type: 'booleanAttribute',
      name: 'checked'
    },
    // material design hooks
    'model.id': [
      { hook: 'cb', type: 'attribute', name: 'id' },
      { hook: 'cblabel', type: 'attribute', name: 'for' }
    ]
  },
  events: {
    'change': 'toggleActive',
    'click [data-hook~="name"]': 'editFacets'
  },
  toggleActive: function () {
    this.model.isActive = !this.model.isActive;
  },
  render: function () {
    this.renderWithTemplate(this);
    window.componentHandler.upgradeElement(this.el);
  }
});
