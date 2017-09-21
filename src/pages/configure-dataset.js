var PageView = require('./base');
var templates = require('../templates');
var FacetCollectionView = require('./configure-dataset/facet-collection');
var app = require('ampersand-app');
var $ = require('jquery');

// Assumption:
// this.model instanceof Dataset
// this.collection instanceof facet-collection

module.exports = PageView.extend({
  template: templates.configureDataset.page,
  render: function () {
    this.renderWithTemplate();

    if (this.collection) {
      this.collection.sort();
      this.renderCollection(this.collection, FacetCollectionView, this.queryByHook('facet-list'));
    }
    this.query('#description').value = this.model.description; // material design lite does not like this via bindings...
  },
  initialize: function () {
    this.isLockedDown = app.me.isLockedDown;
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
    showSearch: 'boolean',
    isLockedDown: 'boolean'
  },
  bindings: {
    'isLockedDown': [
      { type: 'toggle', hook: 'add-button', invert: 'yes' },
      { type: 'toggle', hook: 'rescan-button', invert: 'yes' }
    ],
    'showSearch': {
      type: 'toggle',
      hook: 'search-bar'
    },
    'needle': {
      type: 'value',
      hook: 'facet-selector'
    },
    'model.name': {
      type: 'attribute',
      selector: '#name',
      name: 'value'
    }
  },
  events: {
    'input [data-hook~=facet-selector]': 'input',
    'input #name': 'setName',
    'input #description': 'setDescription',
    'click #eab': 'enableAllFacets',
    'click #dab': 'disableAllFacets',
    'click [data-hook~=add-button]': 'add',
    'click [data-hook~=rescan-button]': 'rescan',
    'click [data-hook~=search-button]': 'search',
    'click [data-hook~=clear-button]': 'clear'
  },
  enableAllFacets: function () {
    var i;
    var f = $('[data-hook~=cblabel]');
    for (i = 0; i < f.length; i++) {
      var c = f[i].classList;
      if (!c.contains('is-checked')) {
        f[i].click();
      }
    }
  },
  disableAllFacets: function () {
    var i;
    var f = $('[data-hook~=cblabel]');
    for (i = 0; i < f.length; i++) {
      var c = f[i].classList;
      if (c.contains('is-checked')) {
        f[i].click();
      }
    }
  },
  input: function () {
    var select = this.el.querySelector('[data-hook~="facet-selector"]');
    this.needle = select.value;

    this.update();
  },
  setName: function () {
    var field = this.query('#name');
    this.model.name = field.value;
  },
  setDescription: function () {
    var field = this.query('#description');
    this.model.description = field.value;
  },
  add: function () {
    this.collection.add({name: 'New Facet'});
    window.componentHandler.upgradeDom();
  },
  rescan: function () {
    this.model.scan();
    window.componentHandler.upgradeDom();
  },
  search: function () {
    this.showSearch = !this.showSearch;
    if (this.showSearch) {
      this.queryByHook('facet-selector').focus();
    }
  },
  clear: function () {
    this.needle = '';
    this.update();
  },
  update: function () {
    // build regexp for searching
    try {
      var regexp = new RegExp(this.needle, 'i'); // case insensitive search

      // search through collection, check both name and description
      this.collection.forEach(function (e) {
        var hay = e.name + e.description;
        e.show = regexp.test(hay.toLowerCase());
      });
    } catch (error) {
    }
  }
});
