var View = require('ampersand-view');
var templates = require('../../templates');
var GroupView = require('./group');

module.exports = View.extend({
  template: templates.configurePartition.partitionCategorial,
  bindings: {
    'model.isCategorial': {
      type: 'toggle',
      hook: 'group-categorial-panel'
    }
  },
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(this.model.groups, GroupView, this.queryByHook('groups-table'));

    return this;
  },
  events: {
    'click [data-hook~=group-order-count]': function () {
      this.model.ordering = 'count';
      this.parent.resetFilter = true;
    },
    'click [data-hook~=group-order-abc]': function () {
      this.model.ordering = 'value';
      this.parent.resetFilter = true;
    }
  }
});
