var View = require('ampersand-view');
var FacetSelector = require('./facetselector.js');
var FacetsEditPage = require('../pages/facetsedit');
var templates = require('../templates');
var app = require('ampersand-app');

function newTitle (view) {
  var model = view.model;

  if (model.primary && model.secondary && model.tertiary) {
    model.title = model.secondary.name + ' vs ' + model.primary.name + ' by ' + model.tertiary.name;
  } else if (view.model.primary && view.model.secondary) {
    model.title = model.secondary.name + ' vs ' + model.primary.name;
  } else if (view.model.primary && view.model.tertiary) {
    model.title = model.primary.name + ' by ' + model.tertiary.name;
  } else if (view.model.primary) {
    model.title = model.primary.name;
  } else {
    model.title = 'Choose a facet';
  }

  // mdl: generate an input event to sync label and input elements
  // note that we are binding to 'change' events, so we are not
  //      creating a short-circuit.
  view.queryByHook('title-input').dispatchEvent(new window.Event('input'));
}

module.exports = View.extend({
  template: templates.includes.widgetframe,
  initialize: function (options) {
    this.collection = app.me.dataset;
  },
  bindings: {
    'model.title': {
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
    // Remove the widget from the widget collection that is maintained by the parent view
    this.parent.collection.remove(this.model);

    // Remove the view from the dom
    this.remove();
  },
  editPrimary: function (e) {
    e.preventDefault(); // prevent browser right-mouse button menu from opening
    if (this.model.primary) {
      app.trigger('page', new FacetsEditPage({model: this.model.primary, widget: this.model}));
    }
  },
  editSecondary: function (e) {
    e.preventDefault(); // prevent browser right-mouse button menu from opening
    if (this.model.secondary) {
      app.trigger('page', new FacetsEditPage({model: this.model.secondary, widget: this.model}));
    }
  },
  editTertiary: function (e) {
    e.preventDefault(); // prevent browser right-mouse button menu from opening
    if (this.model.tertiary) {
      app.trigger('page', new FacetsEditPage({model: this.model.tertiary, widget: this.model}));
    }
  },
  changePrimary: function (newPrimary) {
    this.model.primary = newPrimary;
    newTitle(this);
    this.model.trigger('updatefacets');
  },
  changeSecondary: function (newSecondary) {
    this.model.secondary = newSecondary;
    newTitle(this);
    this.model.trigger('updatefacets');
  },
  changeTertiary: function (newTertiary) {
    this.model.tertiary = newTertiary;
    newTitle(this);
    this.model.trigger('updatefacets');
  },
  changeTitle: function (e) {
    this.model.title = this.queryByHook('title-input').value;
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
        options.model = model; // NOTE: type is determined from options.model.modelType

        var suboptions = {
          collection: view.collection
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
