var View = require('ampersand-view');
var util = require('../../../framework/util/time');

// this.model should be a DatetimeTransform or DurationTransform

var TimeZoneView = View.extend({
  template: '<option data-hook="option"> </option>',
  render: function () {
    this.renderWithTemplate(this);
  },
  bindings: {
    'model.description': {
      hook: 'option',
      type: 'text'
    },
    'model.format': {
      hook: 'option',
      type: 'attribute',
      name: 'value'
    }
  }
});

module.exports = View.extend({
  template: '<select data-hook="options"> </select>',
  initialize: function (options) {
    this.field = options.field;
  },
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(util.timeZones, TimeZoneView, this.queryByHook('options'));

    var value = this.model[this.field];
    this.queryByHook('options').value = value;
  },
  events: {
    'change [data-hook="options"]': 'changeTimeZone'
  },
  changeTimeZone: function () {
    var value = this.queryByHook('options').value;
    this.model[this.field] = value;
  }
});
