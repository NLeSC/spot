var PageView = require('./base');
var templates = require('../templates');

var PartitionContinuousView = require('./configure-partition/partition-continuous');
var PartitionCategorialView = require('./configure-partition/partition-categorial');
var PartitionDatetimeView = require('./configure-partition/partition-datetime');
var PartitionDurationView = require('./configure-partition/partition-duration');
var PartitionTextView = require('./configure-partition/partition-text');

module.exports = PageView.extend({
  initialize: function () {
    this.pageName = 'configurePartition';
  },
  template: templates.configurePartition,
  bindings: {
    'model.label': {
      type: 'value',
      hook: 'partition-title-input'
    },
    'model.showLabel': {
      type: 'booleanAttribute',
      hook: 'show-label',
      name: 'checked'
    },
    'model.showLegend': {
      type: 'booleanAttribute',
      hook: 'show-legend',
      name: 'checked'
    }
  },
  session: {
    resetFilter: ['boolean', true, false]
  },
  events: {
    'change [data-hook~=partition-title-input]': function () {
      this.model.label = this.queryByHook('partition-title-input').value;
    },
    'change [data-hook~=show-label]': function () {
      this.model.showLabel = !this.model.showLabel;
    },
    'change [data-hook~=show-legend]': function () {
      this.model.showLegend = !this.model.showLegend;
    }
  },
  initialize: function () {
    this.once('remove', function () {
      if (this.resetFilter) {
        var filter = this.model.collection.parent;
        filter.releaseDataFilter();

        if (!this.isCategorial) {
          this.model.setGroups();
        }

        filter.initDataFilter();
        filter.updateDataFilter();
      }
    }, this);
  },
  subviews: {
    groupContinuous: {
      hook: 'partition-continuous',
      prepareView: function (el) {
        return new PartitionContinuousView({
          el: el,
          model: this.model
        });
      }
    },
    groupCategorial: {
      hook: 'partition-categorial',
      prepareView: function (el) {
        return new PartitionCategorialView({
          el: el,
          model: this.model
        });
      }
    },
    groupDatetime: {
      hook: 'partition-datetime',
      prepareView: function (el) {
        return new PartitionDatetimeView({
          el: el,
          model: this.model
        });
      }
    },
    groupDuration: {
      hook: 'partition-duration',
      prepareView: function (el) {
        return new PartitionDurationView({
          el: el,
          model: this.model
        });
      }
    },
    groupText: {
      hook: 'partition-text',
      prepareView: function (el) {
        return new PartitionTextView({
          el: el,
          model: this.model
        });
      }
    }
  }
});
