var PageView = require('./base');
var templates = require('../templates');

var PartitionContinuousView = require('../views/partition-continuous');
var PartitionCategorialView = require('../views/partition-categorial');
var PartitionTimeView = require('../views/partition-time');

module.exports = PageView.extend({
  pageTitle: 'Partition - Edit',
  template: templates.pages.configurePartition,
  bindings: {
    'model.name': {
      type: 'text',
      hook: 'navbar-facet-name'
    }
  },
  initialize: function (options) {
    // set up grouping for continuous groups, if necessary
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
    groupTime: {
      hook: 'partition-time',
      prepareView: function (el) {
        return new PartitionTimeView({
          el: el,
          model: this.model
        });
      }
    }
  }
});
