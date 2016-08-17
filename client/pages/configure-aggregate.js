var PageView = require('./base');
var templates = require('../templates');

var AggregateView = require('../views/facet-aggregate');

module.exports = PageView.extend({
  pageTitle: 'Aggregate - Edit',
  template: templates.pages.configureAggregate,
  bindings: {
    'model.name': {
      type: 'text',
      hook: 'navbar-facet-name'
    }
  },
  subviews: {
    aggregate: {
      hook: 'facet-aggregate',
      prepareView: function (el) {
        return new AggregateView({
          el: el,
          model: this.model
        });
      }
    }
  }
});
