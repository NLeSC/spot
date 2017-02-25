var View = require('ampersand-view');
var util = require('../../../framework/util/time');

// this.model should be a DatetimeTransform

var TimePartView = View.extend({
  template: '<option data-hook="option"> </option>',
  render: function () {
    this.renderWithTemplate(this);
  },
  bindings: {
    'model.description': [
      {
        hook: 'option',
        type: 'text'
      },
      {
        hook: 'option',
        type: 'attribute',
        name: 'value'
      }
    ]
  }
});

module.exports = View.extend({
  template: '<select data-hook="options"> </select>',
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(util.timeParts, TimePartView, this.queryByHook('options'));

    var value = this.model.transformedFormat;
    this.queryByHook('options').value = value;
  },
  events: {
    'change [data-hook="options"]': 'changeTimePart'
  },
  changeTimePart: function () {
    var value = this.queryByHook('options').value;
    this.model.transformedFormat = value;
  }
});
