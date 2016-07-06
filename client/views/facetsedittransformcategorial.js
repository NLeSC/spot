var View = require('ampersand-view');
var templates = require('../templates');

var CategoryItem = require('../models/categoryitem');
var CategoryItemView = require('./categoryitem');

module.exports = View.extend({
  template: templates.includes.facetsedittransformcategorial,
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(this.model.categories, CategoryItemView, this.queryByHook('category-collection-table'));

    return this;
  },
  bindings: {
    'model.isCategorial': {
      type: 'toggle',
      hook: 'transform-categorial-panel'
    }
  },
  events: {
    'click [data-hook~=category-addone-button]': function () {
      this.model.categories.add({});
    },

    'click [data-hook~=category-removeall-button]': function () {
      this.model.categories.reset();
    }
  }
});
