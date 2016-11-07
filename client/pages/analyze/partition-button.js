var View = require('ampersand-view');
var templates = require('../../templates');
var app = require('ampersand-app');

module.exports = View.extend({
  template: templates.analyze.partitionButton,
  bindings: {
    'model.name': {
      type: 'text',
      hook: 'chip-text'
    },
    'model.facetId': {
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
