var View = require('ampersand-view');
var templates = require('../templates');

var CategorialRuleView = require('./categorial-rule');

module.exports = View.extend({
  template: templates.includes.facetTransformCategorial,
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(this.model.categorialTransform, CategorialRuleView, this.queryByHook('categorial-rules-table'));

    return this;
  },
  bindings: {
    'model.isCategorial': {
      type: 'toggle',
      hook: 'transform-categorial-panel'
    }
  },
  events: {
    'click [data-hook~=categorial-generaterules-button]': function () {
      this.model.setCategories(false);
    },
    'click [data-hook~=categorial-addone-button]': function () {
      this.model.categorialTransform.add({});
    },
    'click [data-hook~=categorial-removeall-button]': function () {
      this.model.categorialTransform.reset();
    }
  }
});
