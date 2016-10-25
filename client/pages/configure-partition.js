var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');

var PartitionContinuousView = require('./configure-partition/partition-continuous');
var PartitionCategorialView = require('./configure-partition/partition-categorial');
var PartitionTimeView = require('./configure-partition/partition-time');

module.exports = PageView.extend({
  pageTitle: 'Partition - Edit',
  template: templates.pages.configurePartition,
  derived: {
    name: {
      deps: ['model.facetId'],
      fn: function () {
        var facet = app.me.dataset.facets.get(this.model.facetId);
        return facet.name;
      }
    }
  },
  bindings: {
    'name': {
      type: 'text',
      hook: 'navbar-facet-name'
    }
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
