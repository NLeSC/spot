var View = require('ampersand-view');
var templates = require('../templates');
var app = require('ampersand-app');
var Partition = require('../models/partition');
var PartitionButtonView = require('./partition-button');

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

  return null;
}

module.exports = View.extend({
  template: templates.includes.widgetFrame,
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
    _dropZoneToolTipId: {
      deps: ['model.id'],
      fn: function () {
        return 'dropZone:filter:' + this.model.filter.id;
      }
    }
  },
  bindings: {
    'model.filter.title': {
      type: 'value',
      hook: 'title-input'
    },
    'showFacetBar': {
      type: 'toggle',
      hook: 'dropzone'
    },

    // link up mdl javascript behaviour on the page
    '_title_id': [
      { type: 'attribute', hook: 'title-input', name: 'id' },
      { type: 'attribute', hook: 'title-label', name: 'for' }
    ],
    '_dropZoneToolTipId': [
      { type: 'attribute', hook: 'dropzone', name: 'id' },
      { type: 'attribute', hook: 'drozonett', name: 'for' }
    ]
  },
  events: {
    'click [data-hook~="close"]': 'closeWidget',
    'change [data-hook~="title-input"]': 'changeTitle',

    'drop [data-hook~="dropzone"]': 'dropPartition',
    'dragstart .facetDropZone': 'dragFacetStart',
    'dragover .facetDropZone': 'allowFacetDrop'
  },
  dragFacetStart: function (ev) {
    ev.dataTransfer.setData('text', ev.target.id);
  },
  allowFacetDrop: function (ev) {
    ev.preventDefault();
  },
  dropPartition: function (ev) {
    var facet = facetFromEvent(this, ev);
    if (!facet) {
      return;
    }

    var filter = this.model.filter;
    var partitions = filter.partitions;
    var rank = partitions.length + 1;

    var partition = new Partition({
      facetId: facet.getId(),
      rank: rank
    });
    partition.setTypeAndRanges();
    partition.setGroups();
    partition.updateSelection();

    partitions.add(partition);
  },
  closeWidget: function () {
    // Remove the filter from the dataset
    var filters = this.model.filter.collection;
    filters.remove(this.model.filter);

    // Remove the view from the dom
    this.remove();
  },
  changeTitle: function (e) {
    this.model.filter.title = this.queryByHook('title-input').value;
  },
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(this.model.filter.partitions, PartitionButtonView, this.queryByHook('dropzone'));
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
