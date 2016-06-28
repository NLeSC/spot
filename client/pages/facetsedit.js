var PageView = require('./base');
var templates = require('../templates');

var FacetsEditGeneralView = require('../views/facetseditgeneral');
var FacetsEditTypeView = require('../views/facetsedittype');
var FacetsEditBasevalueView = require('../views/facetseditbasevalue');
var FacetsEditTransformView = require('../views/facetsedittransform');
var FacetsEditGroupingView = require('../views/facetseditgrouping');
var FacetsEditReductionView = require('../views/facetseditreduction');

module.exports = PageView.extend({
  pageTitle: 'Facets - Edit',
  template: templates.pages.facetsedit,
  initialize: function (options) {
    this.filter = options.filter;
  },
  render: function () {
    this.renderWithTemplate();

    // If the facet is part of a filter, reinit the filter
    this.once('remove', function () {
      if (this.filter) {
        this.filter.initDataFilter();
      }
    }, this);
  },
  subviews: {
    general: {
      hook: 'facets-edit-general',
      prepareView: function (el) {
        return new FacetsEditGeneralView({
          el: el,
          model: this.model
        });
      }
    },
    type: {
      hook: 'facets-edit-type',
      prepareView: function (el) {
        return new FacetsEditTypeView({
          el: el,
          model: this.model
        });
      }
    },
    basevalue: {
      hook: 'facets-edit-basevalue',
      prepareView: function (el) {
        return new FacetsEditBasevalueView({
          el: el,
          model: this.model
        });
      }
    },
    transform: {
      hook: 'facets-edit-transform',
      prepareView: function (el) {
        return new FacetsEditTransformView({
          el: el,
          model: this.model
        });
      }
    },
    grouping: {
      hook: 'facets-edit-grouping',
      prepareView: function (el) {
        return new FacetsEditGroupingView({
          el: el,
          model: this.model
        });
      }
    },
    reduction: {
      hook: 'facets-edit-reduction',
      prepareView: function (el) {
        return new FacetsEditReductionView({
          el: el,
          model: this.model
        });
      }
    }
  }
});
