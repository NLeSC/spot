var View = require('ampersand-view');
var templates = require('../templates');
var app = require('ampersand-app');

var GroupView = require('./group');

module.exports = View.extend({
  template: templates.includes.partitionTime,
  derived: {
    show: {
      deps: ['model.facetId'],
      fn: function () {
        var facet = app.me.dataset.facets.get(this.model.facetId);
        return facet.displayDatetime;
      }
    }
  },
  bindings: {
    'show': {
      type: 'toggle',
      hook: 'group-time-panel'
    },

    'model.minvalAsText': {
      type: 'value',
      hook: 'group-startdate-input'
    },
    'model.maxvalAsText': {
      type: 'value',
      hook: 'group-enddate-input'
    },
    'model.groupingTimeResolution': {
      type: 'value',
      hook: 'group-resolution-input'
    },
    'model.groupingTimeFormat': {
      type: 'value',
      hook: 'group-format-input'
    }
  },
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(this.model.groups, GroupView, this.queryByHook('groups-table'));
    return this;
  },
  events: {
    'click [data-hook~=group-minmax-button]': function () {
      this.model.setMinMax();
      this.queryByHook('group-startdate-input').dispatchEvent(new window.Event('input'));
      this.queryByHook('group-enddate-input').dispatchEvent(new window.Event('input'));
      this.queryByHook('group-resolution-input').dispatchEvent(new window.Event('input'));
      this.queryByHook('group-format-input').dispatchEvent(new window.Event('input'));
    },
    'click [data-hook~=group-group-button]': function () {
      this.model.setGroups();
    },
    'change [data-hook~=group-startdate-input]': function () {
      this.model.minvalAsText = this.queryByHook('group-startdate-input').value;
    },
    'change [data-hook~=group-enddate-input]': function () {
      this.model.maxvalAsText = this.queryByHook('group-enddate-input').value;
    },
    'change [data-hook~=group-resolution-input]': function () {
      this.model.groupingTimeResolution = this.queryByHook('group-resolution-input').value;
    },
    'change [data-hook~=group-format-input]': function () {
      this.model.groupingTimeFormat = this.queryByHook('group-format-input').value;
    }
  }
});
