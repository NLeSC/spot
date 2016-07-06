var PageView = require('./base');
var templates = require('../templates');

var FacetsEditGeneralView = require('../views/facetseditgeneral');
var FacetsEditTypeView = require('../views/facetsedittype');
var FacetsEditBasevalueView = require('../views/facetseditbasevalue');
var FacetsEditBasevalueTimeView = require('../views/facetseditbasevaluetime');
var FacetsEditTransformContinuousView = require('../views/facetsedittransformcontinuous');
var FacetsEditTransformCategorialView = require('../views/facetsedittransformcategorial');
var FacetsEditTransformTimeView = require('../views/facetsedittransformtime');
var FacetsEditGroupingView = require('../views/facetseditgrouping');
var FacetsEditReductionView = require('../views/facetseditreduction');
var FacetsEditReductionTypeView = require('../views/facetseditreductiontype');

module.exports = PageView.extend({
  pageTitle: 'Facets - Edit',
  template: templates.pages.facetsedit,
  initialize: function (options) {
    this.filter = options.filter;
  },
  events: {
    'click [data-hook~=rescan-button]': 'rescan'
  },
  rescan: function () {
    if (this.model.displayContinuous || this.model.displayTime) {
       this.model.setMinMax();
       document.getElementById('grouping-general-minimum').dispatchEvent(new window.Event('input'));
       document.getElementById('grouping-general-maximum').dispatchEvent(new window.Event('input'));
    } else if (this.model.displayCategorial) {
       this.model.setCategories();
    }
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
  renderConent: function () {
    window.componentHandler.upgradeDom();  
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
    basevaluetime: {
      hook: 'facets-edit-basevalue-time',
      prepareView: function (el) {
        return new FacetsEditBasevalueTimeView({
          el: el,
          model: this.model
        });
      }
    },
    transformContinuous: {
      hook: 'facets-edit-transform-continuous',
      prepareView: function (el) {
        return new FacetsEditTransformContinuousView({
          el: el,
          model: this.model
        });
      }
    },
    transformCategorial: {
      hook: 'facets-edit-transform-categorial',
      prepareView: function (el) {
        return new FacetsEditTransformCategorialView({
          el: el,
          model: this.model
        });
      }
    },
    transformTime: {
      hook: 'facets-edit-transform-time',
      prepareView: function (el) {
        return new FacetsEditTransformTimeView({
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
    },
    reductionType: {
      hook: 'facets-edit-reduction-type',
      prepareView: function (el) {
        return new FacetsEditReductionTypeView({
          el: el,
          model: this.model
        });
      }
    }
  }
});
