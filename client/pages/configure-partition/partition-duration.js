var View = require('ampersand-view');
var templates = require('../../templates');
var moment = require('moment-timezone');

module.exports = View.extend({
  template: templates.configurePartition.partitionDuration,
  derived: {
    minvalAsText: {
      deps: ['model.minval', 'model.isDuration'],
      fn: function () {
        if (this.model.isDuration) {
          return this.model.minval.toISOString();
        } else {
          return 'not a date';
        }
      }
    },
    maxvalAsText: {
      deps: ['model.maxval', 'model.isDuration'],
      fn: function () {
        if (this.model.isDuration) {
          return this.model.maxval.toISOString();
        } else {
          return 'not a date';
        }
      }
    }
  },
  bindings: {
    'model.isDuration': {
      type: 'toggle',
      hook: 'group-duration-panel'
    },

    'minvalAsText': {
      type: 'value',
      hook: 'group-startduration-input'
    },
    'maxvalAsText': {
      type: 'value',
      hook: 'group-endduration-input'
    }

  },
  events: {
    'click [data-hook~=group-durationrange-button]': function () {
      var partition = this.model;
      partition.reset();

      this.queryByHook('group-startduration-input').dispatchEvent(new window.Event('input'));
      this.queryByHook('group-endduration-input').dispatchEvent(new window.Event('input'));
      this.parent.resetFilter = true;
    },
    'change [data-hook~=group-startduration-input]': function () {
      var d = moment.duration(this.queryByHook('group-startduration-input').value);
      if (moment.isDuration(d)) {
        this.model.minval = d;
      }
      this.parent.resetFilter = true;
    },
    'change [data-hook~=group-endduration-input]': function () {
      var d = moment.duration(this.queryByHook('group-endduration-input').value);
      if (moment.isDuration(d)) {
        this.model.maxval = d;
      }
      this.parent.resetFilter = true;
    }
  }
});
