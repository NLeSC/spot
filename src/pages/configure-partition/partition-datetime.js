var View = require('ampersand-view');
var templates = require('../../templates');
var moment = require('moment-timezone');
var TimeZonesSelect = require('../configure-facet/time-zones-select');

module.exports = View.extend({
  template: templates.configurePartition.partitionDatetime,
  derived: {
    minvalAsText: {
      deps: ['model.minval', 'model.isDatetime'],
      fn: function () {
        if (this.model.isDatetime) {
          return this.model.minval.toISOString();
        } else {
          return 'not a date';
        }
      }
    },
    maxvalAsText: {
      deps: ['model.maxval', 'model.isDatetime'],
      fn: function () {
        if (this.model.isDatetime) {
          return this.model.maxval.toISOString();
        } else {
          return 'not a date';
        }
      }
    }
  },
  bindings: {
    'model.isDatetime': {
      type: 'toggle',
      hook: 'group-datetime-panel'
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
    'change [data-hook=time-units]': function () {
      var value = this.queryByHook('time-units').value;
      this.model.groupingDatetime = value;
    },
    'click [data-hook~=group-datetimerange-button]': function () {
      var partition = this.model;
      partition.reset();

      this.queryByHook('group-startdate-input').dispatchEvent(new window.Event('input'));
      this.queryByHook('group-enddate-input').dispatchEvent(new window.Event('input'));
      this.parent.resetFilter = true;
    },
    'change [data-hook~=group-startdate-input]': function () {
      var d = moment(this.queryByHook('group-startdate-input').value);
      if (d.isValid()) {
        this.model.minval = d;
      }
      this.parent.resetFilter = true;
    },
    'change [data-hook~=group-enddate-input]': function () {
      var d = moment(this.queryByHook('group-enddate-input').value);
      if (d.isValid()) {
        this.model.maxval = d;
      }
      this.parent.resetFilter = true;
    }
  },
  subviews: {
    timeZones: {
      hook: 'time-zones',
      prepareView: function (el) {
        return new TimeZonesSelect({
          el: el,
          field: 'zone',
          model: this.model
        });
      }
    }
  },
  render: function () {
    this.renderWithTemplate(this);

    this.queryByHook('time-units').value = this.model.groupingDatetime;
  }
});
