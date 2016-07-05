var View = require('ampersand-view');
var templates = require('../templates');

var CategoryCollectionView = require('./category-collection');

module.exports = View.extend({
  template: templates.includes.facetsedittransform,
  bindings: {
    'model.isContinuous': {
      type: 'toggle',
      hook: 'transform-continuous-panel'
    },
    'model.isCategorial': {
      type: 'toggle',
      hook: 'transform-categorial-panel'
    },
    'model.isTime': {
      type: 'toggle',
      hook: 'transform-time-panel'
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
    },

    // Bindings for: transform-category

    // Bindings for: transform-time
    'model.transformTimeUnits': {
      type: 'value',
      hook: 'transform-time-units-input'
    },
    'model.transformTimeZone': {
      type: 'value',
      hook: 'transform-time-zone-input'
    },
    'model.transformTimeReference': {
      type: 'value',
      hook: 'transform-time-reference-input'
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
    },

    'change [data-hook~=transform-time-units-input]': function () {
      this.model.transformTimeUnits = this.queryByHook('transform-time-units-input').value;
    },
    'change [data-hook~=transform-time-zone-input]': function () {
      this.model.transformTimeZone = this.queryByHook('transform-time-zone-input').value;
    },
    'change [data-hook~=transform-time-reference-input]': function () {
      this.model.transformTimeReference = this.queryByHook('transform-time-reference-input').value;
    }
  },
  subviews: {
    categories: {
      hook: 'transform-categorial-collection',
      prepareView: function (el) {
        return new CategoryCollectionView({
          el: el,
          collection: this.model.categories
        });
      }
    }
  }
});
