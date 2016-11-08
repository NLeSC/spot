var View = require('ampersand-view');
var templates = require('../../templates');

module.exports = View.extend({
  template: templates.home.dataset,
  bindings: {
    'model.name': {
      hook: 'name',
      type: 'text'
    },
    'model.URL': {
      hook: 'name',
      type: 'attribute',
      name: 'href'
    },
    'model.description': {
      hook: 'description',
      type: 'text'
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
    'change': 'toggleActive'
  },
  toggleActive: function () {
    this.model.isActive = !this.model.isActive;
  }
});
