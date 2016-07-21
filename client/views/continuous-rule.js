var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
  template: templates.includes.continuousRule,
  bindings: {
    'model.x': {
      type: 'value',
      hook: 'continuous-x-input'
    },
    'model.fx': {
      type: 'value',
      hook: 'continuous-fx-input'
    }
  },
  events: {
    'click [data-hook~=continuous-remove]': function () {
      this.collection.remove(this.model);
    },
    'change [data-hook~=continuous-x-input]': function () {
      this.model.min = this.queryByHook('continuous-x-input').value;
    },
    'change [data-hook~=continuous-fx-input]': function () {
      this.model.max = this.queryByHook('continuous-fx-input').value;
    }
  }
});
