var app = require('ampersand-app');
var Router = require('ampersand-router');
var HomePage = require('./pages/home');
var FacetsPage = require('./pages/facets');
var ConfigureFacetPage = require('./pages/configure-facet');
var ConfigurePartitionPage = require('./pages/configure-partition');
var AnalyzePage = require('./pages/analyze');

module.exports = Router.extend({
  routes: {
    '': 'home',
    'home': 'home',
    'facets': 'facets',
    'filter/:fid/:rank': 'configurePartition',
    'facet/:id': 'configureFacet',
    'analyze': 'analyze',
    '(*path)': 'catchAll'
  },

  // ------- ROUTE HANDLERS ---------
  home: function () {
    app.trigger('page', new HomePage({
      model: app.me
    }));
  },

  facets: function () {
    app.trigger('page', new FacetsPage({
      model: app.me.dataset,
      collection: app.me.dataset.facets
    }));
  },

  configureFacet: function (id) {
    app.trigger('page', new ConfigureFacetPage({
      model: app.me.dataset.facets.get(id)
    }));
  },

  configurePartition: function (fid, pid) {
    var filter = app.me.dataset.filters.get(fid);
    var partition = filter.partitions.get(pid, 'rank');
    app.trigger('page', new ConfigurePartitionPage({
      model: partition
    }));
  },

  analyze: function () {
    app.trigger('page', new AnalyzePage({
      model: app.me.dataset,
      collection: app.me.dataset.filters
    }));
  },

  catchAll: function () {
    this.redirectTo('');
  }
});
