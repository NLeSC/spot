var View = require('ampersand-view');
var util = require('../../../framework/util/time');

var DurationUnitsView = View.extend({
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
    this.renderCollection(util.durationUnits, DurationUnitsView, this.queryByHook('options'));

    var value = this.parent.model.transformedUnits;
    if (!value || value === '') {
      value = 'NONE';
    }

    this.queryByHook('options').value = value;
  },
  events: {
    'change [data-hook="options"]': 'changeDurationUnits'
  },
  changeDurationUnits: function () {
    var timeTransform = this.parent.model;

    var value = this.queryByHook('options').value;
    if (value === 'NONE') {
      value = '';
    }
    timeTransform.transformedUnits = value;
  }
});
