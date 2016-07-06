var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
  template: templates.includes.facetsedittransformtime,
  bindings: {
    'model.isTime': {
      type: 'toggle',
      hook: 'transform-time-panel'
    },

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
    'change [data-hook~=transform-time-units-input]': function () {
      this.model.transformTimeUnits = this.queryByHook('transform-time-units-input').value;
    },
    'change [data-hook~=transform-time-zone-input]': function () {
      this.model.transformTimeZone = this.queryByHook('transform-time-zone-input').value;
    },
    'change [data-hook~=transform-time-reference-input]': function () {
      this.model.transformTimeReference = this.queryByHook('transform-time-reference-input').value;
    }
  }
});
