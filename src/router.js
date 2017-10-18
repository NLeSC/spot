var app = require('ampersand-app');
var Router = require('ampersand-router');
var HomePage = require('./pages/home');
var DatasetsPage = require('./pages/datasets');
var SharePage = require('./pages/share');
var ConfigureDatasetPage = require('./pages/configure-dataset');
var ConfigureFacetPage = require('./pages/configure-facet');
var ConfigurePartitionPage = require('./pages/configure-partition');
var AnalyzePage = require('./pages/analyze');

/**
 * [exports description]
 * @module router
 */
module.exports = Router.extend({
  routes: {
    '': 'home',
    'home': 'home',
    'datasets': 'datasets',
    'analyze': 'analyze',
    'share': 'share',

    'dataset/:id': 'configureDataset',
    'facet/:id': 'configureFacet',
    'partition/:id': 'configurePartition',
    'session=(*url)': 'getSession',
    '(*path)': 'catchAll'
  },

  // ------- ROUTE HANDLERS ---------
  home: function () {
    app.trigger('page', new HomePage({
      model: app.me
    }));
  },

  datasets: function () {
    app.trigger('page', new DatasetsPage({
      model: app.me
    }));
  },

  analyze: function () {
    app.trigger('page', new AnalyzePage({
      model: app.me.dataview,
      collection: app.me.dataview.filters
    }));
  },

  share: function () {
    app.trigger('page', new SharePage({
      model: app.me
    }));
  },

  configureDataset: function (id) {
    var dataset = app.me.datasets.get(id);
    if (dataset) {
      app.trigger('page', new ConfigureDatasetPage({
        model: dataset,
        collection: dataset.facets
      }));
    } else {
      this.home();
    }
  },

  configureFacet: function (id) {
    var dataset = null;
    var facet = null;

    // look for facet in app.me.datasets
    app.me.datasets.forEach(function (d) {
      facet = d.facets.get(id);
      if (facet) {
        dataset = d;
      }
    });

    // look for facet in app.me.dataview
    facet = app.me.dataview.facets.get(id);
    if (facet) {
      dataset = app.me.dataview;
    }

    if (dataset) {
      facet = dataset.facets.get(id);
      app.trigger('page', new ConfigureFacetPage({
        dataset: dataset,
        model: facet
      }));
    } else {
      this.home();
      console.error('Facet not found');
    }
  },

  configurePartition: function (id) {
    // Search over all filters and partitions in this dataset to find the right partition
    // Not very pretty, but the number of filters and filters per partition are small
    var partitionToEdit;
    var found = false;
    app.me.dataview.filters.forEach(function (filter) {
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
      this.home();
    }
  },
  getSession: function (url) {
    console.log('Getting a remote session from:', url);
    app.downloadRemoteSession(url);
  },
  catchAll: function () {
    this.redirectTo('');
  }
});
