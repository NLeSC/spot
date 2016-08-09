var View = require('ampersand-view');
var templates = require('../templates');

var GroupView = require('./group');

module.exports = View.extend({
  template: templates.includes.facetGroupContinuous,
  bindings: {
    'model.displayContinuous': {
      type: 'toggle',
      hook: 'group-continuous-panel'
    },

    'model.minvalAsText': {
      type: 'value',
      hook: 'group-minimum-input'
    },
    'model.maxvalAsText': {
      type: 'value',
      hook: 'group-maximum-input'
    },

    'model.groupingParam': {
      type: 'value',
      hook: 'group-param-input'
    },
    'model.groupFixedN': {
      type: 'booleanAttribute',
      hook: 'group-fixedn-input',
      name: 'checked'
    },
    'model.groupFixedSC': {
      type: 'booleanAttribute',
      hook: 'group-fixedsc-input',
      name: 'checked'
    },
    'model.groupFixedS': {
      type: 'booleanAttribute',
      hook: 'group-fixeds-input',
      name: 'checked'
    },
    'model.groupLog': {
      type: 'booleanAttribute',
      hook: 'group-log-input',
      name: 'checked'
    }
  },
  events: {
    'change [data-hook~=group-minimum-input]': function () {
      this.model.minvalAsText = this.queryByHook('group-minimum-input').value;
    },
    'change [data-hook~=group-maximum-input]': function () {
      this.model.maxvalAsText = this.queryByHook('group-maximum-input').value;
    },
    'click [data-hook~=group-minmax-button]': function () {
      this.model.groups.reset();
      this.model.setMinMax(true);
      this.queryByHook('group-minimum-input').dispatchEvent(new window.Event('input'));
      this.queryByHook('group-maximum-input').dispatchEvent(new window.Event('input')); // FIXME: wrong animation when no values in input
    },
    'click [data-hook~=group-group-button]': function () {
      this.model.groups.reset();
      this.model.setContinuousGroups();
    },

    'change [data-hook~=group-param-input]': function () {
      this.model.groupingParam = parseFloat(this.queryByHook('group-param-input').value);
    },
    'click [data-hook~=group-fixedn-input]': function () {
      this.model.groupingContinuous = 'fixedn';
    },
    'click [data-hook~=group-fixedsc-input]': function () {
      this.model.groupingContinuous = 'fixedsc';
    },
    'click [data-hook~=group-fixeds-input]': function () {
      this.model.groupingContinuous = 'fixeds';
    },
    'click [data-hook~=group-log-input]': function () {
      this.model.groupingContinuous = 'log';
    }
  },
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(this.model.groups, GroupView, this.queryByHook('groups-table'));
  }
});
