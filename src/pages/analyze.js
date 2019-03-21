var app = require('ampersand-app');
var $ = require('jquery');
var PageView = require('./base');
var templates = require('../templates');
var WidgetFrameView = require('./analyze/widget-frame');
var FacetbarItemView = require('./analyze/facetbar-item');
var sortablejs = require('sortablejs');
var Share = require('./share');

// NOTE: gridster does not work properly with require()
// workaround via browserify-shim (configured in package.json)
require('gridster');

function initializeCharts (view) {
  var gridster = view._widgetsGridster;

  // BUGFIX: can sometimes get called before gridster is fully initialized
  if (!gridster) {
    return;
  }

  var i;
  for (i = 0; i < gridster.$widgets.length; i++) {
    var chartView = $(gridster.$widgets[i]).data('spotWidgetFrameView')._subviews[0];
    chartView.model.updateConfiguration();

    if (chartView.model.isConfigured) {
      if (!chartView.model.filter.isInitialized) {
        if (chartView.isInitialized) {
          chartView.deinitChart(); // deininit charts that had a filter released
        }
        chartView.model.filter.initDataFilter();
      }
      if (chartView.isInitialized) {
        // noop
      } else {
        chartView.initChart();
      }
    } else {
      if (chartView.isInitialized) {
        chartView.deinitChart();
      }
      if (chartView.model.filter.isInitialized) {
        chartView.model.filter.releaseDataFilter();
      }
    }
  }
}

function deinitializeCharts (view) {
  var gridster = view._widgetsGridster;

  var i;
  for (i = 0; i < gridster.$widgets.length; i++) {
    var chartView = $(gridster.$widgets[i]).data('spotWidgetFrameView')._subviews[0];
    if (chartView.isInitialized) {
      chartView.deinitChart();
    }
    if (chartView.model.isConfigured) {
      chartView.model.filter.releaseDataFilter();
    }
  }
}

function updateCharts (view) {
  var gridster = view._widgetsGridster;

  var i;
  for (i = 0; i < gridster.$widgets.length; i++) {
    var chartView = $(gridster.$widgets[i]).data('spotWidgetFrameView')._subviews[0];
    if (chartView.isInitialized) {
      chartView.update();
    }
  }
}
/**
 * Add a widget to the analyze page for the given filter
 *
 * view {View}             Ampersand View instance of the analyze page
 * filter {Filter}         Spot filter instance to create the widget for
 * editModeHint {boolean}  Try to start plot in editMode (ie. accepts dnd of facets) [true] or in interaction mode (false)
 */
function addWidgetForFilter (view, filter, editModeHint) {
  var gridster = view._widgetsGridster;
  var row = filter.row || 1;
  var col = filter.col || 1;
  var sizeX = filter.size_x || 3;
  var sizeY = filter.size_y || 3;

  var el = gridster.add_widget('<div class="widgetOuterFrame"></div>', sizeX, sizeY, col, row);
  var frameView = new WidgetFrameView({
    model: filter
  });

  // render, and render content of widget frame
  view.renderSubview(frameView, el[0]);
  frameView.renderContent();

  // link element and view so we can:
  // a) on remove, get to the HTMLElement from the WidgetFrameView
  // b) on resize, get to the WidgetFrameView from the HTMLElement
  frameView.gridsterHook = el[0];
  $(el[0]).data('spotWidgetFrameView', frameView);

  // try to initialize and render possibly present data
  // only follow editModeHint when the widget is configured, default to true
  var chartView = frameView.widget;
  chartView.model.updateConfiguration();
  if (chartView.model.isConfigured) {
    if (!filter.isInitialized) {
      filter.initDataFilter();
    }
    if (!chartView.isInitialized) {
      chartView.initChart();
    }
    chartView.update();

    frameView.editMode = editModeHint;
  } else {
    // widget is not configured, ignore editModeHint
    // and always go to edit mode
    frameView.editMode = true;
  }

  filter.on('newData', function () {
    chartView.update();
  });
}

module.exports = PageView.extend({
  template: templates.analyze.page,
  session: {
    fullscreenMode: ['boolean', true, true]
  },
  initialize: function () {
    this.pageName = 'analyze';
    this.fullscreenMode = app.fullscreenMode;

    app.on('refresh', function () {
      initializeCharts(this);
      app.me.dataview.getData();
    }, this);

    this.once('remove', function () {
      // remove callbacks for 'app#refresh'
      app.off('refresh');

      // remove callbacks for 'filter#newData'
      app.me.dataview.filters.forEach(function (filter) {
        filter.off('newData');
      });
    });

    if (app.me.dataview.datasetIds.length === 0) {
      app.message({
        text: 'No data to analyze, please upload and/or select some datasets',
        type: 'ok'
      });
    }
    if (app.me.dataview.datasetIds.length > 1) {
        app.message({
            text: 'There are more than 1 datasets.',
            type: 'ok'
        });
    }
  },
  derived: {
    dataString: {
      deps: ['model.dataTotal', 'model.dataSelected'],
      fn: function () {
        var percentage;
        if (this.model.dataTotal > 0) {
          percentage = 100.0 * this.model.dataSelected / this.model.dataTotal;
        } else {
          percentage = 0;
        }
        return this.model.dataTotal +
          ' total, ' +
          this.model.dataSelected +
          ' selected (' +
          percentage.toPrecision(3) +
          '%)';
      }
    }
  },
  bindings: {
    'fullscreenMode': [
      { type: 'toggle', hook: 'chart-bar', invert: true },
      { type: 'toggle', hook: 'facet-bar', invert: true }
    ],
    'dataString': {
      type: 'text',
      hook: 'data-string'
    }
  },
  events: {
    'click #viewAll': 'viewAll',
    'click #fullscreenButton': 'toggleFullscreen',
    'click #resetFiltersButton': 'resetFilters',
    'click .widgetIcon': 'addChart'
  },
  addChart: function (ev) {
    // what icon was clicked?
    var target = ev.target || ev.srcElement;
    var id = target.id;

    var filter = this.model.filters.add({ chartType: id });
    addWidgetForFilter(this, filter, true);
  },
  toggleFullscreen: function () {
    app.fullscreenMode = !app.fullscreenMode;
    this.fullscreenMode = app.fullscreenMode;
  },
  resetFilters: function () {
    app.me.dataview.pause();
    app.me.dataview.filters.forEach(function (filter) {
      // undo drill downs
      while (filter.zoomHistory.length > 0) {
        filter.zoomOut();
      }
      // and clear possible selection
      filter.zoomOut();
    });
    app.me.dataview.play();
    app.me.dataview.getData();
    app.message({
      text: 'Reselected all data',
      type: 'ok'
    });
  },
  viewAll: function () {
    this._subviews.forEach(function (v) {
      if (v._values && v._values.hasOwnProperty('editMode')) {
        v.editMode = false;
      }
    });
  },
  render: function (opts) {
    this.renderWithTemplate(this);

    this.renderCollection(this.model.facets, FacetbarItemView, this.queryByHook('facet-bar-items'), {
      filter: function (m) {
        return m.isActive;
      }
    });

    return this;
  },
  renderContent: function () {
    var widgetNeedsData = false;

    var el = document.getElementById('facetBar');
    this._facetsSortable = sortablejs.create(el, {
      draggable: '.mdl-chip',
      dataIdAttr: 'data-id',
      sort: false,
      group: {
        name: 'facets',
        pull: 'clone',
        put: false
      },
      onStart: function (evt) {
        var item = evt.item;
        var facetId = item.getAttribute('data-id');
        var facet = app.me.dataview.facets.get(facetId);
        app.trigger('dragStart', facet.type);
      },
      onEnd: function (evt) {
        app.trigger('dragEnd');
      },
      onAdd: function (evt) {
        var item = evt.item;
        item.remove();
      }
    });
    this._widgetsGridster = $('[id~=widgets]').gridster({
      widget_base_dimensions: [100, 100],
      min_cols: 1,
      max_cols: 20,
      avoid_overlapped_widgets: false,
      widget_selector: 'div',
      draggable: {
        enabled: true,
        handle: '.widgetDragBar',
        stop: function () {
          var widgets = this.$widgets;
          var i = 0;
          for (i = 0; i < widgets.length; i++) { // $.each
            var widget = widgets[i];
            var data = $(widget).data();
            var filter = data['spotWidgetFrameView'].model.filter;
            var grid = data['coords'].grid;

            filter.row = grid.row;
            filter.col = grid.col;
            filter.size_x = grid.size_x;
            filter.size_y = grid.size_y;
          }
        }
      },
      resize: {
        enabled: true,
        start: function (e, ui, widget) {
          var view = widget.data('spotWidgetFrameView')._subviews[0];
          view.deinitChart();
        },
        stop: function (e, ui, widget) {
          var view = widget.data('spotWidgetFrameView')._subviews[0];
          var filter = view.model.filter;
          if (view.isInitialized) {
            view.update();
          }

          // keep track of the position of the chart
          var info = widget.data('coords').grid;
          filter.row = info.row;
          filter.col = info.col;
          filter.size_x = info.size_x;
          filter.size_y = info.size_y;
          if (view.model.isConfigured) {
            view.initChart();
          }
          if (view.isInitialized) {
            view.update();
          }
        }
      }
    }).data('gridster');

    this.on('remove', function () {
      this._facetsSortable.destroy();
      this._widgetsGridster.destroy();
    });

    // pause dataset to prevent needless data updates
    this.model.pause();

    // add widgets for each filter to the page
    this.model.filters.forEach(function (filter) {
      addWidgetForFilter(this, filter, false);

      if (!filter.data || filter.data.length === 0) {
        widgetNeedsData = true;
      }
    }, this);

    // done, unpause the dataset
    this.model.play();

    if (widgetNeedsData) {
      app.me.dataview.getData();
    }

    // do a last pass to render data
    updateCharts(this);
  },
  initializeCharts: function () {
    initializeCharts(this);
  },
  deinitializeCharts: function () {
    deinitializeCharts(this);
  },
  updateCharts: function () {
    updateCharts(this);
  }
});
