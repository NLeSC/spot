var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
  template: templates.includes.facetAggregate,
  bindings: {
    'model.displayContinuous': {
      type: 'toggle',
      hook: 'aggregate-continuous-panel'
    },
    'model.reduceCount': {
      type: 'booleanAttribute',
      hook: 'aggregate-count-input',
      name: 'checked'
    },
    'model.reduceSum': {
      type: 'booleanAttribute',
      hook: 'aggregate-sum-input',
      name: 'checked'
    },
    'model.reduceAverage': {
      type: 'booleanAttribute',
      hook: 'aggregate-average-input',
      name: 'checked'
    },
    'model.reduceAbsolute': {
      type: 'booleanAttribute',
      hook: 'aggregate-general-absolute-input',
      name: 'checked'
    },
    'model.reducePercentage': {
      type: 'booleanAttribute',
      hook: 'aggregate-general-percentage-input',
      name: 'checked'
    }
  },
  events: {
    'click [data-hook~=aggregate-count-input]': function () {
      this.model.reduction = 'count';
    },
    'click [data-hook~=aggregate-sum-input]': function () {
      this.model.reduction = 'sum';
    },
    'click [data-hook~=aggregate-average-input]': function () {
      this.model.reduction = 'avg';
    },
    'click [data-hook~=aggregate-general-absolute-input]': function () {
      this.model.reductionType = 'absolute';
    },
    'click [data-hook~=aggregate-general-percentage-input]': function () {
      this.model.reductionType = 'percentage';
    }
  }
});
