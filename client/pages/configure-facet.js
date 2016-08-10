var PageView = require('./base');
var templates = require('../templates');

var FacetDefineView = require('../views/facet-define');

var FacetTransformContinuousView = require('../views/facet-transform-continuous');
var FacetTransformCategorialView = require('../views/facet-transform-categorial');
var FacetTransformTimeView = require('../views/facet-transform-time');

module.exports = PageView.extend({
  pageTitle: 'Facets - Edit',
  template: templates.pages.configureFacet,
  bindings: {
    'model.name': {
      type: 'text',
      hook: 'navbar-facet-name'
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
    }
  }
});
