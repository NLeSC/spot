var View = require('ampersand-view');
var templates = require('../templates');

var CategoryCollectionView = require('./category-collection');

module.exports = View.extend({
  template: templates.includes.facetsedittransformcontinuous,
  bindings: {
    'model.isContinuous': {
      type: 'toggle',
      hook: 'transform-continuous-panel'
    },

    // Bindings for: transform-continuous
    'model.transformNone': {
      type: 'booleanAttribute',
      hook: 'transform-continuous-none-input',
      name: 'checked'
    },
    'model.transformPercentiles': {
      type: 'booleanAttribute',
      hook: 'transform-continuous-percentiles-input',
      name: 'checked'
    },
    'model.transformExceedances': {
      type: 'booleanAttribute',
      hook: 'transform-continuous-exceedances-input',
      name: 'checked'
    }
  },
  events: {
    'click [data-hook~=transform-continuous-none-input]': function () {
      this.model.transform = 'none';
    },
    'click [data-hook~=transform-continuous-percentiles-input]': function () {
      this.model.transform = 'percentiles';
    },
    'click [data-hook~=transform-continuous-exceedances-input]': function () {
      this.model.transform = 'exceedances';
    }
  }
});
