var View = require('ampersand-view');
var templates = require('../../templates');
var app = require('ampersand-app');

module.exports = View.extend({
  template: templates.analyze.aggregateButton,
  derived: {
    icon: {
      deps: ['model.operation'],
      fn: function () {
        var operation = this.model.operation;
        if (operation === 'count') {
          return 'n';
        } else if (operation === 'avg') {
          return 'avg';
        } else if (operation === 'sum') {
          return 'sum';
        } else if (operation === 'min') {
          return 'min';
        } else if (operation === 'max') {
          return 'max';
        }
      }
    },
    aggregateId: {
      fn: function () {
        return this.model.getId();
      }
    }
  },
  bindings: {
    'model.name': {
      type: 'text',
      hook: 'chip-text'
    },
    'icon': {
      type: 'text',
      hook: 'rotate-operation'
    },
    'aggregateId': {
      type: 'attribute',
      hook: 'chip',
      name: 'data-id'
    }
  },
  events: {
    'click [data-hook~="chip"]': 'rotateOperation'
  },
  rotateOperation: function () {
    var values = ['count', 'avg', 'sum', 'min', 'max'];

    var i = values.indexOf(this.model.operation) + 1;
    if (i >= values.length) {
      i = 0;
    }

    if (app.me.dataview.datasetType === 'client' && values[i] === 'min' | values[i] === 'max') {
      // crossfilter does not support min/max
      i = 0;
    }

    this.model.operation = values[i];

    // refresh data for this plot
    this.model.collection.parent.initDataFilter();
  }
});
