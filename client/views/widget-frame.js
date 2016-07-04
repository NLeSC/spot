var View = require('ampersand-view');
var FacetsEditPage = require('../pages/facetsedit');
var templates = require('../templates');
var app = require('ampersand-app');

function facetFromEvent (view, ev) {
  var filter = view.model.filter;
  var dataset = filter.collection.parent;

  var facets = dataset.facets;

  var content = ev.dataTransfer.getData('text').split(':');

  if (content[0] === 'facet') {
    // a facet dropped from the facet bar
    ev.preventDefault();
    ev.stopPropagation();
    return facets.get(content[1]);
  }

  if (content[0] === 'filter') {
    // a facet dropped from another chart
    var sourceFilter = dataset.filters.get(content[2]);
    ev.preventDefault();
    ev.stopPropagation();

    if (content[1] === 'primary') {
      return sourceFilter.primary;
    } else if (content[1] === 'secondary') {
      return sourceFilter.secondary;
    } else if (content[1] === 'tertiary') {
      return sourceFilter.tertiary;
    }
  }

  return null;
}

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
    var filter = this.model;

    // Create the actual chart model based on the data
    this.model = app.widgetFactory.newModel({
      modelType: filter.chartType,
      filter: filter,
      filterId: filter.id
    });

    filter.on('newfacets', function () {
      this.model.trigger('change:filter.primary');
      this.model.trigger('change:filter.secondary');
      this.model.trigger('change:filter.tertiary');
      newTitle(this);
    }, this); // listener removed by chart view
  },
  props: {
    showFacetBar: ['boolean', true, true]
  },
  derived: {
    // unique identifiers to hook up the mdl javascript
    _title_id: {
      deps: ['model.id'],
      fn: function () {
        return this.id + '_title';
      }
    },
    // tooltips id for primary, secondary, and tertiary facet
    ttpId: {
      deps: ['model.id'],
      fn: function () {
        return 'filter:primary:' + this.model.filter.id;
      }
    },
    ttsId: {
      deps: ['model.id'],
      fn: function () {
        return 'filter:secondary:' + this.model.filter.id;
      }
    },
    tttId: {
      deps: ['model.id'],
      fn: function () {
        return 'filter:tertiary:' + this.model.filter.id;
      }
    }
  },
  bindings: {
    'model.filter.title': {
      type: 'value',
      hook: 'title-input'
    },
    // link up mdl javascript behaviour on the page
    '_title_id': [
      { type: 'attribute', hook: 'title-input', name: 'id' },
      { type: 'attribute', hook: 'title-label', name: 'for' }
    ],
    'ttpId': [
      { type: 'attribute', hook: 'primaryfacet', name: 'id' },
      { type: 'attribute', hook: 'primaryfacettt', name: 'for' }
    ],
    'ttsId': [
      { type: 'attribute', hook: 'secondaryfacet', name: 'id' },
      { type: 'attribute', hook: 'secondaryfacettt', name: 'for' }
    ],
    'tttId': [
      { type: 'attribute', hook: 'tertiaryfacet', name: 'id' },
      { type: 'attribute', hook: 'tertiaryfacettt', name: 'for' }
    ],
    'showFacetBar': {
      type: 'toggle',
      hook: 'dropZone'
    },
    'model.hasPrimary': {
      type: 'toggle',
      hook: 'primaryfacet'
    },
    'model.hasSecondary': {
      type: 'toggle',
      hook: 'secondaryfacet'
    },
    'model.hasTertiary': {
      type: 'toggle',
      hook: 'tertiaryfacet'
    },
    'model.filter.primary': {
      type: 'booleanClass',
      hook: 'primaryfacetname',
      yes: 'mdl-button--accent'
    },
    'model.filter.secondary': {
      type: 'booleanClass',
      hook: 'secondaryfacetname',
      yes: 'mdl-button--accent'
    },
    'model.filter.tertiary': {
      type: 'booleanClass',
      hook: 'tertiaryfacetname',
      yes: 'mdl-button--accent'
    },
    'model.filter.primary.name': {
      type: 'text',
      hook: 'primaryfacetname'
    },
    'model.filter.secondary.name': {
      type: 'text',
      hook: 'secondaryfacetname'
    },
    'model.filter.tertiary.name': {
      type: 'text',
      hook: 'tertiaryfacetname'
    }
  },
  events: {
    'click [data-hook~="close"]': 'closeWidget',
    'click [data-hook~="primaryfacetname"]': 'editPrimary',
    'click [data-hook~="secondaryfacetname"]': 'editSecondary',
    'click [data-hook~="tertiaryfacetname"]': 'editTertiary',

    'drop [data-hook~="primaryfacet"]': 'dropFacetA',
    'drop [data-hook~="secondaryfacet"]': 'dropFacetB',
    'drop [data-hook~="tertiaryfacet"]': 'dropFacetC',

    'change [data-hook~="title-input"]': 'changeTitle',

    'dragstart .facetDropZone': 'dragFacetStart',
    'dragover .facetDropZone': 'allowFacetDrop'
  },
  dragFacetStart: function (ev) {
    ev.dataTransfer.setData('text', ev.target.id);
  },
  allowFacetDrop: function (ev) {
    ev.preventDefault();
  },
  dropFacetA: function (ev) {
    this.model.filter.primary = facetFromEvent(this, ev);
    this.model.trigger('change:filter.primary');
    newTitle(this);
    this.model.filter.initDataFilter();
  },
  dropFacetB: function (ev) {
    this.model.filter.secondary = facetFromEvent(this, ev);
    this.model.trigger('change:filter.secondary');
    newTitle(this);
    this.model.filter.initDataFilter();
  },
  dropFacetC: function (ev) {
    this.model.filter.tertiary = facetFromEvent(this, ev);
    this.model.trigger('change:filter.tertiary');
    newTitle(this);
    this.model.filter.initDataFilter();
  },
  closeWidget: function () {
    // Remove the filter from the dataset
    var filters = this.model.filter.collection;
    filters.remove(this.model.filter); // FIXME: on remove, release filter

    // Remove the view from the dom
    this.remove();
  },
  editPrimary: function () {
    var filter = this.model.filter;

    if (filter.primary) {
      app.trigger('page', new FacetsEditPage({
        model: filter.primary,
        filter: filter
      }));
    }
  },
  editSecondary: function () {
    var filter = this.model.filter;

    if (filter.secondary) {
      app.trigger('page', new FacetsEditPage({
        model: filter.secondary,
        filter: filter
      }));
    }
  },
  editTertiary: function () {
    var filter = this.model.filter;

    if (filter.tertiary) {
      app.trigger('page', new FacetsEditPage({
        model: filter.tertiary,
        filter: filter
      }));
    }
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
        options.model = options.parent.model; // NOTE: type is determined from options.model.modelType
        return app.viewFactory.newView(options);
      }
    }
  }
});
