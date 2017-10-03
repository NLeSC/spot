var View = require('ampersand-view');
var templates = require('../../templates');

var CategorialRuleView = require('./categorial-rule');

module.exports = View.extend({
  template: templates.configureFacet.facetTransformCategorial,
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(this.model.rules, CategorialRuleView, this.queryByHook('categorial-rules-table'));

    return this;
  },
  events: {
    'click [data-hook~=categorial-addone-button]': function () {
      this.model.rules.add({});
    },
    'click [data-hook~=categorial-removeall-button]': function () {
      this.model.reset();
    }
  }
});
