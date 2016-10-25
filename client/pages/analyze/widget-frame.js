var View = require('ampersand-view');
var templates = require('../../templates');
var app = require('ampersand-app');
var PartitionButtonView = require('./partition-button');
var AggregateButtonView = require('./aggregate-button');
var $ = require('jquery');

// NOTE: gridster does not work properly with require()
// workaround via browserify-shim (configured in package.json)
require('gridster');

function removeWidget (view, filter) {
  // Remove the filter from the dataset
  var filters = filter.collection;
  filters.remove(filter);

  // Remove gridster stuff
  var gridster = $('[id~=widgets]').gridster().data('gridster');
  gridster.remove_widget(view.gridsterHook);

  // Remove ampersand stuff
  var p = view.parent._subviews;
  p.splice(p.indexOf(view), 1);
  view.remove();
}

module.exports = View.extend({
  template: templates.analyze.widgetFrame,
  initialize: function (opts) {
    var filter = this.model;

    // Create the actual chart model based on the data
    this.model = app.widgetFactory.newModel({
      modelType: filter.chartType,
      filter: filter,
      filterId: filter.id
    });

    // inform the filter on the number of partitions and aggregates
    filter.minPartitions = this.model.minPartitions;
    filter.maxPartitions = this.model.maxPartitions;
    filter.minAggregates = this.model.minAggregates;
    filter.maxAggregates = this.model.maxAggregates;
  },
  props: {
    editMode: ['boolean', true, true]
  },
  bindings: {
    'editMode': [
      { hook: 'dropzones', type: 'toggle', invert: false },
      { hook: 'plot-menu', type: 'toggle', invert: true }
    ]
  },
  events: {
    'click [data-hook~="close"]': 'closeWidget',
    'click [data-hook~="zoom-in"]': 'zoomIn',
    'click [data-hook~="zoom-out"]': 'zoomOut',

    'drop [data-hook~="partition-dropzone"]': 'dropPartition',
    'drop [data-hook~="aggregate-dropzone"]': 'dropAggregate',
    'dragover [data-hook~=dropzones]': 'allowFacetDrop'
  },
  allowFacetDrop: function (ev) {
    ev.preventDefault();
  },
  dropPartition: function (ev) {
    var filter = this.model.filter;
    var dataset = filter.collection.parent;
    var facets = dataset.facets;

    var facet = this.parent.facetFromEvent(facets, ev);
    if (!facet) {
      return;
    }

    var partitions = filter.partitions;
    if (partitions.length === filter.maxPartitions) {
      return;
    }

    partitions.add({
      facetId: facet.getId(),
      label: facet.name,
      units: facet.units,
      rank: partitions.length + 1
    });
  },
  dropAggregate: function (ev) {
    var filter = this.model.filter;
    var dataset = filter.collection.parent;
    var facets = dataset.facets;

    var facet = this.parent.facetFromEvent(facets, ev);
    if (!facet) {
      return;
    }

    var aggregates = filter.aggregates;
    if (aggregates.length === filter.maxAggregates) {
      return;
    }

    // NOTE: as the default aggregation is by count,
    // the plot doesnt change and we do not have to reinit
    // the data filter yet. This assumes there is no missing data.
    // FIXME: an extra aggregate implies an extra condition, so could change data..
    aggregates.add({
      facetId: facet.getId(),
      label: facet.name,
      units: facet.units,
      rank: aggregates.length + 1
    });
  },
  zoomIn: function (ev) {
    var filter = this.model.filter;
    filter.zoomIn();
  },
  zoomOut: function () {
    var filter = this.model.filter;
    filter.zoomOut();
  },
  closeWidget: function () {
    removeWidget(this, this.model.filter);
  },
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(this.model.filter.partitions, PartitionButtonView, this.queryByHook('partition-dropzone'));
    this.renderCollection(this.model.filter.aggregates, AggregateButtonView, this.queryByHook('aggregate-dropzone'));
    return this;
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
