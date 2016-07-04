var View = require('ampersand-view');
var templates = require('../templates');

var CategoryItem = require('../models/categoryitem');
var CategoryItemView = require('./categoryitem');

module.exports = View.extend({
  template: templates.includes.categorycollection,
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(this.collection, CategoryItemView, this.queryByHook('category-collection-table'));

    return this;
  },
  events: {
    'click [data-hook~=category-rescan-button]': function () {
      // Hierarchy: dataset -> facet -> category-collection -> item
      var facet = this.collection.parent;
      facet.setCategories();
    },

    'click [data-hook~=category-addone-button]': function () {
      this.collection.add(new CategoryItem());
    },

    'click [data-hook~=category-removeall-button]': function () {
      this.collection.reset();
    }
  }
});
