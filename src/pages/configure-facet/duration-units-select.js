var Spot = require('spot-framework');
var View = require('ampersand-view');
var timeUtil = Spot.util.time;

// this.model should be a DurationTransform

var DurationUnitsView = View.extend({
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
  initialize: function (options) {
    this.field = options.field;
  },
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(timeUtil.durationUnits, DurationUnitsView, this.queryByHook('options'));

    var value = this.model[this.field];
    this.queryByHook('options').value = value;
  },
  events: {
    'change [data-hook="options"]': 'changeDurationUnits'
  },
  changeDurationUnits: function () {
    var value = this.queryByHook('options').value;
    this.model[this.field] = value;
  }
});
