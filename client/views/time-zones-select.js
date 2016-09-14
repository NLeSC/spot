var View = require('ampersand-view');
var util = require('../util-time');

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
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(util.timeZones, TimeZoneView, this.queryByHook('options'));

    var timeTransform = this.parent.model.timeTransform;
    var select = this.queryByHook('options');
    select.value = timeTransform.transformedZone;
  },
  events: {
    'change [data-hook="options"]': 'changeTimeZone'
  },
  changeTimeZone: function () {
    var timeTransform = this.parent.model.timeTransform;

    var select = this.queryByHook('options');
    timeTransform.transformedZone = select.value;
  }
});
