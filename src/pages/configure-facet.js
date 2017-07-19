var PageView = require('./base');
var templates = require('../templates');

var FacetDefineView = require('./configure-facet/facet-define');

var FacetTransformContinuousView = require('./configure-facet/facet-transform-continuous');
var FacetTransformCategorialView = require('./configure-facet/facet-transform-categorial');
var FacetTransformDatetimeView = require('./configure-facet/facet-transform-datetime');
var FacetTransformDurationView = require('./configure-facet/facet-transform-duration');

module.exports = PageView.extend({
  initialize: function () {
    this.pageName = 'configureFacet';
  },
  template: templates.configureFacet,
  bindings: {
    'model.isCategorial': {
      hook: 'transform-categorial-panel',
      type: 'toggle'
    },
    'model.isContinuous': {
      hook: 'transform-continuous-panel',
      type: 'toggle'
    },
    'model.isDatetime': {
      hook: 'transform-datetime-panel',
      type: 'toggle'
    },
    'model.isDuration': {
      hook: 'transform-duration-panel',
      type: 'toggle'
    }
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
          model: this.model.continuousTransform
        });
      }
    },
    transformCategorial: {
      hook: 'facet-transform-categorial',
      prepareView: function (el) {
        return new FacetTransformCategorialView({
          el: el,
          model: this.model.categorialTransform
        });
      }
    },
    transformDatetime: {
      hook: 'facet-transform-datetime',
      prepareView: function (el) {
        return new FacetTransformDatetimeView({
          el: el,
          model: this.model.datetimeTransform
        });
      }
    },
    transformDuration: {
      hook: 'facet-transform-duration',
      prepareView: function (el) {
        return new FacetTransformDurationView({
          el: el,
          model: this.model.durationTransform
        });
      }
    }
  }
});
