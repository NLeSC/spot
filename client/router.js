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
    'partition/:id': 'configurePartition',
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
      dataset: app.me.dataset,
      model: app.me.dataset.facets.get(id)
    }));
  },

  configurePartition: function (id) {
    // Search over all filters and partitions in this dataset to find the right partition
    // Not very pretty, but the number of filters and filters per partition are small
    var partitionToEdit;
    var found = false;
    app.me.dataset.filters.forEach(function (filter) {
      filter.partitions.forEach(function (partition) {
        if (partition.getId() === id) {
          found = true;
          partitionToEdit = partition;
        }
      });
    });

    if (found) {
      app.trigger('page', new ConfigurePartitionPage({ model: partitionToEdit }));
    } else {
      app.trigger('page', new HomePage({ model: app.me }));
    }
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
