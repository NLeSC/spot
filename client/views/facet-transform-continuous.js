var View = require('ampersand-view');
var templates = require('../templates');

var ContinuousRuleView = require('./continuous-rule');

module.exports = View.extend({
  template: templates.includes.facetTransformContinuous,
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(this.model.continuousTransform, ContinuousRuleView, this.queryByHook('continuous-rules-table'));

    return this;
  },
  bindings: {
    'model.isContinuous': {
      type: 'toggle',
      hook: 'transform-continuous-panel'
    }
  },
  events: {
    'click [data-hook~=continuous-percentiles-button]': function () {
      this.model.setPercentiles();
      window.componentHandler.upgradeDom();
    },
    'click [data-hook~=continuous-exceedences-button]': function () {
      this.model.setExceedances();
      window.componentHandler.upgradeDom();
    },
    'click [data-hook~=continuous-addone-button]': function () {
      this.model.continuousTransform.add({});
      window.componentHandler.upgradeDom();
    },
    'click [data-hook~=continuous-removeall-button]': function () {
      this.model.continuousTransform.reset();
    }
  }
});
