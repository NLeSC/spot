var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
  template: templates.includes.categoryitem,
  bindings: {
    'model.category': {
      type: 'value',
      hook: 'category-value-input'
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
    'change [data-hook~=category-value-input]': function () {
      this.model.value = this.queryByHook('category-value-input').value;
    },
    'change [data-hook~=category-group-input]': function () {
      this.model.group = this.queryByHook('category-group-input').value;
    }
  }
});
