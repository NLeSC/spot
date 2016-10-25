var View = require('ampersand-view');
var templates = require('../templates');
var GroupView = require('./group');

module.exports = View.extend({
  template: templates.includes.partitionCategorial,
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
    'click [data-hook~=group-rescan-button]': function () {
      this.model.setGroups();
      this.model.collection.trigger('change', this.model, {});
    },
    'click [data-hook~=group-order-count]': function () {
      this.model.groups.comparator = 'negCount';
      this.model.groups.sort();
    },
    'click [data-hook~=group-order-abc]': function () {
      this.model.groups.comparator = 'label';
      this.model.groups.sort();
    }
  }
});
