var View = require('ampersand-view');
var templates = require('../../templates');

module.exports = View.extend({
  template: templates.configureFacet.categorialRule,
  bindings: {
    'model.expression': {
      type: 'value',
      hook: 'category-expression-input'
    },
    'model.count': {
      type: 'text',
      hook: 'category-value-count'
    },
    'model.group': {
      type: 'value',
      hook: 'category-group-input'
    }
  },
  events: {
    'click [data-hook~=category-remove]': function () {
      this.collection.remove(this.model);
    },
    'change [data-hook~=category-expression-input]': function () {
      this.model.expression = this.queryByHook('category-expression-input').value;
    },
    'change [data-hook~=category-group-input]': function () {
      this.model.group = this.queryByHook('category-group-input').value;
    }
  }
});
