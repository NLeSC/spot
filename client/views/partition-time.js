var View = require('ampersand-view');
var templates = require('../templates');
var moment = require('moment-timezone');

module.exports = View.extend({
  template: templates.includes.partitionTime,
  derived: {
    minvalAsText: {
      deps: ['model.minval', 'model.isDatetime'],
      fn: function () {
        if (this.model.isDatetime) {
          return this.model.minval.format();
        } else {
          return 'not a date';
        }
      }
    },
    maxvalAsText: {
      deps: ['model.maxval', 'model.isDatetime'],
      fn: function () {
        if (this.model.isDatetime) {
          return this.model.maxval.format();
        } else {
          return 'not a date';
        }
      }
    }
  },
  bindings: {
    'model.isDatetime': {
      type: 'toggle',
      hook: 'group-time-panel'
    },

    'minvalAsText': {
      type: 'value',
      hook: 'group-startdate-input'
    },
    'maxvalAsText': {
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
  events: {
    'click [data-hook~=group-timerange-button]': function () {
      var partition = this.model;
      partition.setTypeAndRanges();

      this.queryByHook('group-startdate-input').dispatchEvent(new window.Event('input'));
      this.queryByHook('group-enddate-input').dispatchEvent(new window.Event('input'));
      this.queryByHook('group-resolution-input').dispatchEvent(new window.Event('input'));
      this.queryByHook('group-format-input').dispatchEvent(new window.Event('input'));
    },
    'change [data-hook~=group-startdate-input]': function () {
      this.model.minval = moment(this.queryByHook('group-startdate-input').value);
    },
    'change [data-hook~=group-enddate-input]': function () {
      this.model.maxval = moment(this.queryByHook('group-enddate-input').value);
    },
    'change [data-hook~=group-resolution-input]': function () {
      this.model.groupingTimeResolution = this.queryByHook('group-resolution-input').value;
    },
    'change [data-hook~=group-format-input]': function () {
      this.model.groupingTimeFormat = this.queryByHook('group-format-input').value;
    }
  }
});
