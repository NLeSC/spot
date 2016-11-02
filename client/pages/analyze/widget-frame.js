var View = require('ampersand-view');
var templates = require('../../templates');
var app = require('ampersand-app');
var PartitionButtonView = require('./partition-button');
var AggregateButtonView = require('./aggregate-button');
var $ = require('jquery');
var sortablejs = require('sortablejs');

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
    'click [data-hook~="zoom-out"]': 'zoomOut'
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

    // used to add partitions and aggregates
    var filter = this.model.filter;
    var dataset = filter.collection.parent;
    var facets = dataset.facets;
    var partitions = filter.partitions;

    this._partitionsSortable = sortablejs.create(this.queryByHook('partition-dropzone'), {
      draggable: '.mdl-chip',
      group: {
        name: 'facets',
        pull: true,
        put: true
      },
      onAdd: function (evt) {
        // get the dropped facet, but remove the automatically added element
        // because the ampersand view collection takes care of rendering a
        // prettier one
        var item = evt.item;
        var facetId = item.getAttribute('data-id');
        var facet = facets.get(facetId);
        item.remove();

        if (facet && partitions.length !== filter.maxPartitions) {
          partitions.add({
            facetId: facetId,
            name: facet.name,
            units: facet.units,
            rank: partitions.length + 1
          });
        }
      },
      onRemove: function (evt) {
        var partition = partitions.get(evt.oldIndex, 'rank');
        partitions.remove(partition);
      },
      onUpdate: function (evt) {
        var first = Math.min(evt.oldIndex, evt.newIndex);
        var last = Math.max(evt.oldIndex, evt.newIndex);
        var reindex = [];

        // resort partitions, but take care that the index stays unique
        // [1,2,3,4,5]
        // [1,4,2,3,5]  4 -> 2
        // [1,3,4,2,5]  2 -> 4

        // find which models to reindex
        partitions.forEach(function (partition) {
          if (partition.rank >= first && partition.rank <= last) {
            reindex.push(partition);
          }
        });

        // remove from partition
        reindex.forEach(function (partition) {
          partitions.remove(partition, {silent: true});
        });

        // recalculate index, and insert again to partition
        reindex.forEach(function (partition) {
          if (partition.rank === evt.oldIndex) {
            partition.set({rank: evt.newIndex}, {silent: true});
          } else if (evt.oldIndex > evt.newIndex) {
            partition.set({rank: partition.rank + 1}, {silent: true});
          } else if (evt.oldIndex < evt.newIndex) {
            partition.set({rank: partition.rank - 1}, {silent: true});
          }
          partitions.add(partition, {silent: true});
        });
        filter.initDataFilter();
      }
    });
    this._aggregatesSortable = sortablejs.create(this.queryByHook('aggregate-dropzone'), {
      draggable: '.mdl-chip',
      group: {
        name: 'facets',
        pull: true,
        put: true
      },
      onAdd: function (evt) {
        // get the dropped facet, but remove the automatically added element
        // because the ampersand view collection takes care of rendering a
        // prettier one
        var item = evt.item;
        var facetId = item.getAttribute('data-id');
        var facet = facets.get(facetId);
        item.remove();

        var aggregates = filter.aggregates;
        if (facet && aggregates.length !== filter.maxAggregates) {
          aggregates.add({
            facetId: facetId,
            name: facet.name,
            units: facet.units,
            rank: aggregates.length + 1
          });
        }
      }
    });
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
