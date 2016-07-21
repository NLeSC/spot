var PageView = require('./base');
var templates = require('../templates');

var FacetDefineView = require('../views/facet-define');

var FacetTransformContinuousView = require('../views/facet-transform-continuous');
var FacetTransformCategorialView = require('../views/facet-transform-categorial');
var FacetTransformTimeView = require('../views/facet-transform-time');

var FacetGroupContinuousView = require('../views/facet-group-continuous');
var FacetGroupCategorialView = require('../views/facet-group-categorial');
var FacetGroupTimeView = require('../views/facet-group-time');

var FacetAggregateView = require('../views/facet-aggregate');

module.exports = PageView.extend({
  pageTitle: 'Facets - Edit',
  template: templates.pages.configureFacet,
  session: {
    starttab: {
      type: 'string',
      default: 'define'
    }
  },
  derived: {
    tabDefine: {deps: ['starttab'], fn: function () { return this.starttab === 'define'; }},
    tabTransform: {deps: ['starttab'], fn: function () { return this.starttab === 'define'; }},
    tabGroup: {deps: ['starttab'], fn: function () { return this.starttab === 'define'; }},
    tabAggregate: {deps: ['starttab'], fn: function () { return this.starttab === 'define'; }}
  },
  bindings: {
    'model.name': {
      type: 'text',
      hook: 'navbar-facet-name'
    },
    'model.tabDefine': [
      {hook: 'tab-define', type: 'booleanClass', name: 'is-active'}, {hook: 'panel-define', type: 'booleanClass', name: 'is-active'},
      {hook: 'tab-transform', type: 'booleanClass', name: 'is-active'}, {hook: 'panel-transform', type: 'booleanClass', name: 'is-active'},
      {hook: 'tab-group', type: 'booleanClass', name: 'is-active'}, {hook: 'panel-group', type: 'booleanClass', name: 'is-active'},
      {hook: 'tab-aggregate', type: 'booleanClass', name: 'is-active'}, {hook: 'panel-aggregate', type: 'booleanClass', name: 'is-active'}
    ]
  },
  initialize: function (options) {
    this.filter = options.filter;
    this.starttab = options.starttab;

    // set up grouping for continuous groups, if necessary
    this.once('remove', function () {
      if (this.model.displayContinuous) {
        this.model.setContinuousGroups();
      }
    });
  },
  render: function () {
    this.renderWithTemplate();

    // If the facet is part of a filter, reinit the filter
    this.once('remove', function () {
      if (this.filter) {
        this.filter.initDataFilter();
      }
    }, this);
    return this;
  },
  renderContent: function () {
    this.queryByHook('tab-' + this.starttab).click();
  },
  subviews: {
    facetDefine: {
      hook: 'facet-define',
      prepareView: function (el) {
        return new FacetDefineView({
          el: el,
          model: this.model
        });
      }
    },

    transformContinuous: {
      hook: 'facet-transform-continuous',
      prepareView: function (el) {
        return new FacetTransformContinuousView({
          el: el,
          model: this.model
        });
      }
    },
    transformCategorial: {
      hook: 'facet-transform-categorial',
      prepareView: function (el) {
        return new FacetTransformCategorialView({
          el: el,
          model: this.model
        });
      }
    },
    transformTime: {
      hook: 'facet-transform-time',
      prepareView: function (el) {
        return new FacetTransformTimeView({
          el: el,
          model: this.model
        });
      }
    },

    groupContinuous: {
      hook: 'facet-group-continuous',
      prepareView: function (el) {
        return new FacetGroupContinuousView({
          el: el,
          model: this.model
        });
      }
    },
    groupCategorial: {
      hook: 'facet-group-categorial',
      prepareView: function (el) {
        return new FacetGroupCategorialView({
          el: el,
          model: this.model
        });
      }
    },
    groupTime: {
      hook: 'facet-group-time',
      prepareView: function (el) {
        return new FacetGroupTimeView({
          el: el,
          model: this.model
        });
      }
    },
    aggregate: {
      hook: 'facet-aggregate',
      prepareView: function (el) {
        return new FacetAggregateView({
          el: el,
          model: this.model
        });
      }
    }
  }
});
