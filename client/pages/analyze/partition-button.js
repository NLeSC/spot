var View = require('ampersand-view');
var templates = require('../../templates');
var app = require('ampersand-app');

module.exports = View.extend({
  template: templates.analyze.partitionButton,
  derived: {
    partitionId: {
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
    'partitionId': {
      type: 'attribute',
      hook: 'chip',
      name: 'data-id'
    }
  },
  events: {
    'click [data-hook~="chip"]': 'configurePartition'
  },
  configurePartition: function () {
    app.navigate('partition/' + this.model.getId());
  }
});
