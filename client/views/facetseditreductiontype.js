var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
  template: templates.includes.facetseditreductiontype,
  bindings: {
    'model.reduceAbsolute': {
      type: 'booleanAttribute',
      hook: 'reduction-type-absolute-input',
      name: 'checked'
    },
    'model.reducePercentage': {
      type: 'booleanAttribute',
      hook: 'reduction-type-percentage-input',
      name: 'checked'
    }
  },
  events: {
    'click [data-hook~=reduction-type-absolute-input]': function () {
      this.model.reductionType = 'absolute';
    },
    'click [data-hook~=reduction-type-percentage-input]': function () {
      this.model.reductionType = 'percentage';
    }
  }
});
