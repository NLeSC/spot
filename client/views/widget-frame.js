var View = require('ampersand-view');
var FacetSelector = require('./facetselector.js');
var FacetsEditPage = require('../pages/facetsedit');
var templates = require('../templates');
var app = require('ampersand-app');

function newTitle (view) {
  var filter = view.model.filter;

  if (filter.primary && filter.secondary && filter.tertiary) {
    filter.title = filter.secondary.name + ' vs ' + filter.primary.name + ' by ' + filter.tertiary.name;
  } else if (filter.primary && filter.secondary) {
    filter.title = filter.secondary.name + ' vs ' + filter.primary.name;
  } else if (filter.primary && filter.tertiary) {
    filter.title = filter.primary.name + ' by ' + filter.tertiary.name;
  } else if (filter.primary) {
    filter.title = filter.primary.name;
  } else {
    filter.title = 'Choose a facet';
  }

  // mdl: generate an input event to sync label and input elements
  // note that we are binding to 'change' events, so we are not
  //      creating a short-circuit.
  view.queryByHook('title-input').dispatchEvent(new window.Event('input'));
}

module.exports = View.extend({
  template: templates.includes.widgetframe,
  initialize: function (opts) {
    this.dataset = opts.dataset;
  },
  bindings: {
    'model.filter.title': {
      type: 'value',
      hook: 'title-input'
    },
    // link up mdl javascript behaviour on the page
    'model._title_id': [
      { type: 'attribute', hook: 'title-input', name: 'id' },
      { type: 'attribute', hook: 'title-label', name: 'for' }
    ]
  },
  events: {
    'click [data-hook~="close"]': 'closeWidget',

    'contextmenu [data-hook~="primaryfacet"]': 'editPrimary',
    'contextmenu [data-hook~="secondaryfacet"]': 'editSecondary',
    'contextmenu [data-hook~="tertiaryfacet"]': 'editTertiary',

    'change [data-hook~="title-input"]': 'changeTitle'
  },
  closeWidget: function () {
    // Remove the filter from the dataset
    var filters = this.model.filter.collection;
    filters.remove(this.model.filter);

    // Remove the view from the dom
    this.remove();
  },
  editPrimary: function (e) {
    var filter = this.model.filter;

    e.preventDefault(); // prevent browser right-mouse button menu from opening
    if (filter.primary) {
      app.trigger('page', new FacetsEditPage({
        model: filter.primary,
        filter: filter
      }));
    }
  },
  editSecondary: function (e) {
    var filter = this.model.filter;

    e.preventDefault(); // prevent browser right-mouse button menu from opening
    if (filter.secondary) {
      app.trigger('page', new FacetsEditPage({
        model: filter.secondary,
        filter: filter
      }));
    }
  },
  editTertiary: function (e) {
    var filter = this.model.filter;

    e.preventDefault(); // prevent browser right-mouse button menu from opening
    if (filter.tertiary) {
      app.trigger('page', new FacetsEditPage({
        model: filter.tertiary,
        filter: filter
      }));
    }
  },
  changePrimary: function (newPrimary) {
    this.model.filter.primary = newPrimary;
    newTitle(this);
    this.model.filter.initDataFilter();
  },
  changeSecondary: function (newSecondary) {
    this.model.filter.secondary = newSecondary;
    newTitle(this);
    this.model.filter.initDataFilter();
  },
  changeTertiary: function (newTertiary) {
    this.model.filter.tertiary = newTertiary;
    newTitle(this);
    this.model.filter.initDataFilter();
  },
  changeTitle: function (e) {
    this.model.filter.title = this.queryByHook('title-input').value;
  },
  renderContent: function () {
    // Propagate to subview
    this.widget.renderContent();
  },
  subviews: {
    widget: {
      hook: 'widget',
      constructor: function (options) {
        var view = options.parent;
        var model = view.model;
        var dataset = view.dataset;

        options.model = model; // NOTE: type is determined from options.model.modelType

        var suboptions = {
          collection: dataset.facets
        };

        // The new view containing the requested widget
        var newview = app.viewFactory.newView(options);

        // we should add the facet/group object,
        // and draw a selector menu for each facet
        if (model.hasPrimary) {
          suboptions.icon = 'swap_horiz';
          suboptions.callback = view.changePrimary;
          view.renderSubview(new FacetSelector(suboptions), '[data-hook~=primaryfacet]');
        }
        if (model.hasSecondary) {
          suboptions.icon = 'swap_vert';
          suboptions.callback = view.changeSecondary;
          view.renderSubview(new FacetSelector(suboptions), '[data-hook~=secondaryfacet]');
        }
        if (model.hasTertiary) {
          suboptions.icon = 'format_color_fill';
          suboptions.callback = view.changeTertiary;
          view.renderSubview(new FacetSelector(suboptions), '[data-hook~=tertiaryfacet]');
        }

        return newview;
      }
    }
  }
});
