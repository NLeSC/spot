var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
  template: templates.includes.facetTransformContinuous,
  bindings: {
    'model.isContinuous': {
      type: 'toggle',
      hook: 'transform-continuous-panel'
    },
    'model.minvalAsText': {
      type: 'value',
      hook: 'define-minimum-input'
    },
    'model.maxvalAsText': {
      type: 'value',
      hook: 'define-maximum-input'
    },

    'model.transformNone': {
      type: 'booleanAttribute',
      hook: 'define-transform-none',
      name: 'checked'
    },
    'model.transformPercentiles': {
      type: 'booleanAttribute',
      hook: 'define-transform-percentiles',
      name: 'checked'
    },
    'model.transformExceedances': {
      type: 'booleanAttribute',
      hook: 'define-transform-exceedances',
      name: 'checked'
    }
  },
  events: {
    'click [data-hook~=define-transform-percentiles]': function () {
      this.model.continuousTransform.clear();
      this.model.setPercentiles();
    },
    'click [data-hook~=define-transform-exceedances]': function () {
      this.model.continuousTransform.clear();
      this.model.setExceedances();
    },
    'click [data-hook~=define-transform-none]': function () {
      this.model.continuousTransform.clear();
    },
    'click [data-hook~=button-minval-missing]': function () {
      this.model.misvalAsText += ', ' + this.model.minvalAsText;
      this.model.minvalAsText = 'scanning';
      this.model.setMinMax(false);
      this.queryByHook('define-minimum-input').dispatchEvent(new window.Event('input'));
    },
    'click [data-hook~=button-maxval-missing]': function () {
      this.model.misvalAsText += ', ' + this.model.maxvalAsText;
      this.model.maxvalAsText = 'scanning';
      this.model.setMinMax(false);
      this.queryByHook('define-maximum-input').dispatchEvent(new window.Event('input'));
    },
    'click [data-hook~=define-rescan-button]': function () {
      this.model.minvalAsText = 'scanning';
      this.model.maxvalAsText = 'scanning';
      this.model.setMinMax(false);
      this.queryByHook('define-minimum-input').dispatchEvent(new window.Event('input'));
      this.queryByHook('define-maximum-input').dispatchEvent(new window.Event('input'));
    },
    'change [data-hook~=define-minimum-input]': function () {
      this.model.minvalAsText = this.queryByHook('define-minimum-input').value;
    },
    'change [data-hook~=define-maximum-input]': function () {
      this.model.maxvalAsText = this.queryByHook('define-maximum-input').value;
    }
  }
});
