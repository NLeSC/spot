var View = require('ampersand-view');
var templates = require('../../templates');
var moment = require('moment-timezone');

module.exports = View.extend({
  template: templates.configurePartition.partitionTime,
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
    }

  },
  events: {
    'click [data-hook~=group-timerange-button]': function () {
      var partition = this.model;
      partition.reset();

      this.queryByHook('group-startdate-input').dispatchEvent(new window.Event('input'));
      this.queryByHook('group-enddate-input').dispatchEvent(new window.Event('input'));
    },
    'change [data-hook~=group-startdate-input]': function () {
      this.model.minval = moment(this.queryByHook('group-startdate-input').value);
    },
    'change [data-hook~=group-enddate-input]': function () {
      this.model.maxval = moment(this.queryByHook('group-enddate-input').value);
    }
  }
});
