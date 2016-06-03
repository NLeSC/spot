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
    'model.transform_time_units': {
      type: 'value',
      hook: 'transform-time-units-input'
    },
    'model.transform_time_zone': {
      type: 'value',
      hook: 'transform-time-zone-input'
    },
    'model.transform_time_reference': {
      type: 'value',
      hook: 'transform-time-reference-input'
    },
    'model.transformNone': [
      {
        type: 'booleanAttribute',
        hook: 'transform-time-none-input',
        name: 'checked'
      },
      {
        type: 'booleanAttribute',
        hook: 'transform-continuous-none-input',
        name: 'checked'
      }
    ],
    'model.transformTimezone': {
      type: 'booleanAttribute',
      hook: 'transform-time-timezone-input',
      name: 'checked'
    },
    'model.transformToDatetime': {
      type: 'booleanAttribute',
      hook: 'transform-time-todatetime-input',
      name: 'checked'
    },
    'model.transformToDuration': {
      type: 'booleanAttribute',
      hook: 'transform-time-toduration-input',
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
    },

    'change [data-hook~=transform-time-units-input]': function () {
      this.model.transform_time_units = this.queryByHook('transform-time-units-input').value;
    },
    'change [data-hook~=transform-time-zone-input]': function () {
      this.model.transform_time_zone = this.queryByHook('transform-time-zone-input').value;
    },
    'change [data-hook~=transform-time-reference-input]': function () {
      this.model.transform_time_reference = this.queryByHook('transform-time-reference-input').value;
    },

    'click [data-hook~=transform-time-none-input]': function () {
      this.model.transform = 'none';
    },
    'click [data-hook~=transform-time-timezone-input]': function () {
      this.model.transform = 'timezone';
    },
    'click [data-hook~=transform-time-todatetime-input]': function () {
      this.model.transform = 'todatetime';
    },
    'click [data-hook~=transform-time-toduration-input]': function () {
      this.model.transform = 'toduration';
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
