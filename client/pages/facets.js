var PageView = require('./base');
var templates = require('../templates');
var FacetCollectionView = require('../views/facet-collection');

// Assumption:
var Dataset = require('../models/dataset'); // this.model instanceof Dataset
var Facets = require('../models/facet-collection'); // this.collection instanceof facet-collection

module.exports = PageView.extend({
  pageTitle: 'Facets',
  template: templates.pages.facets,
  render: function () {
    this.renderWithTemplate();

    if (this.collection) {
      this.collection.sort();
      this.renderCollection(this.collection, FacetCollectionView, this.queryByHook('facet-list'));
    }
  },
  initialize: function () {
    if (!(this.model instanceof Dataset) && (this.collection instanceof Facets)) {
      console.error('Analyze page should have a dataset and a facet collection', this.model, this.collection);
    }
    this.needle = this.collection.needle;
    this.showSearch = this.collection.showSearch;

    this.on('remove', function () {
      this.collection.needle = this.needle;
      this.collection.showSearch = this.showSearch;
    });
    this.update();
  },
  session: {
    needle: 'string',
    showSearch: 'boolean'
  },
  bindings: {
    'showSearch': {
      type: 'toggle',
      hook: 'search-bar'
    },
    'needle': {
      type: 'value',
      hook: 'facet-selector'
    }
  },
  events: {
    'input [data-hook~=facet-selector]': 'input',
    'click [data-hook~=add-button]': 'add',
    'click [data-hook~=rescan-button]': 'rescan',
    'click [data-hook~=search-button]': 'search',
    'click [data-hook~=clear-button]': 'clear'
  },
  input: function () {
    var select = this.el.querySelector('[data-hook~="facet-selector"]');
    this.needle = select.value;

    this.update();
  },
  add: function () {
    this.collection.add({name: 'New Facet'});
  },
  rescan: function () {
    this.model.facets.reset();
    this.model.scanData();
  },
  search: function () {
    this.showSearch = !this.showSearch;
  },
  clear: function () {
    this.needle = '';
    this.update();
  },
  update: function () {
    // build regexp for searching
    var regexp = new RegExp(this.needle, 'i'); // case insensitive search

    // search through collection, check both name and description
    this.collection.forEach(function (e) {
      var hay = e.name + e.description;
      e.show = regexp.test(hay.toLowerCase());
    });
  }
});
