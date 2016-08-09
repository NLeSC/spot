var View = require('ampersand-view');
var templates = require('../templates');
var GroupView = require('./group');

module.exports = View.extend({
  template: templates.includes.facetGroupCategorial,
  bindings: {
    'model.displayCategorial': {
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
      this.model.setCategorialGroups();
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
