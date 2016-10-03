var View = require('ampersand-view');
var templates = require('../templates');
var app = require('ampersand-app');
var Partition = require('../models/partition');
var PartitionButtonView = require('./partition-button');
var interact = require('interact.js');

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

// ///////////////////////////////////////////

  setupDragDrop: function (interact) {
    'use strict';
    var transformProp;
    interact.maxInteractions(Infinity);

      // setup draggable elements.
    interact('.js-drag')
          .draggable({ max: Infinity })
          .on('dragstart', function (event) {
            event.interaction.x = parseInt(event.target.getAttribute('data-x'), 10) || 0;
            event.interaction.y = parseInt(event.target.getAttribute('data-y'), 10) || 0;
          })
          .on('dragmove', function (event) {
            event.interaction.x += event.dx;
            event.interaction.y += event.dy;

            if (transformProp) {
              event.target.style[transformProp] =
                      'translate(' + event.interaction.x + 'px, ' + event.interaction.y + 'px)';
            }
            else {
              event.target.style.left = event.interaction.x + 'px';
              event.target.style.top = event.interaction.y + 'px';
            }
          })
          .on('dragend', function (event) {
            event.target.setAttribute('data-x', event.interaction.x);
            event.target.setAttribute('data-y', event.interaction.y);
          });

      // setup drop areas.
    var dragFacet1 = this.queryByHook('dragFacet1');
    var dragFacet2 = this.queryByHook('dragFacet2');
    var dropFacet = this.queryByHook('dropfacet');
    //   var drop2 = this.queryByHook('drop2');
    //   var drop3 = this.queryByHook('drop3');

      // dropzone #1 accepts draggable #1
      // setupDropzone('#drop1', '#drag1');
      // setupDropzone(this.queryByHook('drop1'), this.queryByHook('drag1'));

      // dropzone #2 accepts draggable #1 and #2
      // setupDropzone('#drop2', '#drag1, #drag2');
      // every dropzone accepts draggable #3
      // setupDropzone('.js-drop', '#drag3');

    setupDropzone('.js-drop', dragFacet1);
    setupDropzone('.js-drop', dragFacet2);

      /**
       * Setup a given element as a dropzone.
       *
       * @param {HTMLElement|String} el
       * @param {String} accept
       */
    function setupDropzone (el, accept) {
      interact(el)
              .dropzone({
                accept: accept,
                ondropactivate: function (event) {
                  addClass(event.relatedTarget, '-drop-possible');
                },
                ondropdeactivate: function (event) {
                  removeClass(event.relatedTarget, '-drop-possible');
                }
              })
              .on('dropactivate', function (event) {
                var active = event.target.getAttribute('active') | 0;

                  // change style if it was previously not active
                if (active === 0) {
                  addClass(event.target, '-drop-possible');
                  event.target.textContent = 'Drop me here!';
                }

                event.target.setAttribute('active', active + 1);
              })
              .on('dropdeactivate', function (event) {
                var active = event.target.getAttribute('active') | 0;

                  // change style if it was previously active
                  // but will no longer be active
                if (active === 1) {
                  removeClass(event.target, '-drop-possible');
                  event.target.textContent = 'Dropzone';
                }

                event.target.setAttribute('active', active - 1);
              })
              .on('dragenter', function (event) {
                addClass(event.target, '-drop-over');
                event.relatedTarget.textContent = 'I\'m in';
              })
              .on('dragleave', function (event) {
                removeClass(event.target, '-drop-over');
                event.relatedTarget.textContent = 'Drag me…';
              })
              .on('drop', function (event) {
                removeClass(event.target, '-drop-over');
                event.relatedTarget.textContent = 'Dropped';
              });
    }

    function addClass (element, className) {
      if (element.classList) {
        return element.classList.add(className);
      }
      else {
        element.className += ' ' + className;
      }
    }

    function removeClass (element, className) {
      if (element.classList) {
        return element.classList.remove(className);
      }
      else {
        element.className = element.className.replace(new RegExp(className + ' *', 'g'), '');
      }
    }

    interact(document).on('ready', function () {
      transformProp = 'transform' in document.body.style
              ? 'transform' : 'webkitTransform' in document.body.style
              ? 'webkitTransform' : 'mozTransform' in document.body.style
              ? 'mozTransform' : 'oTransform' in document.body.style
              ? 'oTransform' : 'msTransform' in document.body.style
              ? 'msTransform' : null;
    });
      // this.window.interact;
  }

  // ///////////////////////////////////////////

  ,
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
    // this.setupDragDrop(interact);
    this.renderWithTemplate(this);
    this.renderCollection(this.model.filter.partitions, PartitionButtonView, this.queryByHook('dropzone'));
    return this;
  },
  renderContent: function () {
    // Propagate to subview
    this.setupDragDrop(interact);
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
