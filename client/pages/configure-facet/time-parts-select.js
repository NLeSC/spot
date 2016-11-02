var View = require('ampersand-view');
var util = require('../../../framework/util/time');

var TimePartView = View.extend({
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
    // following views up to the time-transfrom model:
    // time-parts-select view -> facet-transform-time view -> time-transform model
    //
    // following the models put up to a dataset:
    // time-transform model -> facet model -> facets collection -> dataset
    var dataset = this.parent.model.parent.collection.parent;

    this.renderWithTemplate(this);
    this.renderCollection(util.getTimeParts(dataset), TimePartView, this.queryByHook('options'));

    var value = this.parent.model.transformedFormat;
    if (!value || value === '') {
      value = 'NONE';
    }

    this.queryByHook('options').value = value;
  },
  events: {
    'change [data-hook="options"]': 'changeTimePart'
  },
  changeTimePart: function () {
    var timeTransform = this.parent.model;

    var value = this.queryByHook('options').value;
    timeTransform.transformedFormat = value;
  }
});
