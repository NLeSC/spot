var View = require('ampersand-view');
var templates = require('../../templates');

module.exports = View.extend({
  template: templates.configurePartition.partitionText,
  bindings: {
    'model.isText': {
      type: 'toggle',
      hook: 'group-text-panel'
    }
  },
  events: {
    'click [data-hook~=group-order-count]': function () {
      this.model.ordering = 'count';
    },
    'click [data-hook~=group-order-abc]': function () {
      this.model.ordering = 'abc';
    }
  }
});
