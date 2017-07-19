var app = require('ampersand-app');
var $ = require('jquery');
var PageView = require('./base');
var templates = require('../templates');
var WidgetFrameView = require('./analyze/widget-frame');
var FacetbarItemView = require('./analyze/facetbar-item');
var sortablejs = require('sortablejs');

// NOTE: gridster does not work properly with require()
// workaround via browserify-shim (configured in package.json)
require('gridster');

function initializeCharts (view) {
  var gridster = view._widgetsGridster;

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

function addWidgetForFilter (view, filter) {
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
  }

  filter.on('newData', function () {
    chartView.update();
  });
}

module.exports = PageView.extend({
  template: templates.analyze,
  session: {
    editMode: ['boolean', true, true]
  },
  initialize: function () {
    this.pageName = 'analyze';
    this.editMode = app.editMode;

    app.on('refresh', function () {
      initializeCharts(this);
      app.me.dataview.getAllData();
    }, this);

    this.once('remove', function () {
      // remove callbacks for 'app#refresh'
      app.off('refresh');

      // remove callbacks for 'filter#newData'
      app.me.dataview.filters.forEach(function (filter) {
        filter.off('newData');
      });
    });
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
    'editMode': [
      { type: 'toggle', hook: 'chart-bar' },
      { type: 'toggle', hook: 'facet-bar' }
    ],
    'dataString': {
      type: 'text',
      hook: 'data-string'
    }
  },
  events: {
    'change #editModeSwitch': 'toggleEditMode',
    'click .widgetIcon': 'addChart'
  },
  addChart: function (ev) {
    // what icon was clicked?
    var target = ev.target || ev.srcElement;
    var id = target.id;

    var filter = this.model.filters.add({ chartType: id });
    addWidgetForFilter(this, filter);
  },
  toggleEditMode: function () {
    app.editMode = !app.editMode;
    this.editMode = app.editMode;
    app.trigger('editMode');

    var gridster = this._widgetsGridster;
    if (gridster) {
      if (this.editMode) {
        gridster.enable();
        gridster.enable_resize();
      } else {
        gridster.disable();
        gridster.disable_resize();
      }
    }
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
        enabled: this.editMode,
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
      addWidgetForFilter(this, filter);

      if (!filter.data || filter.data.length === 0) {
        widgetNeedsData = true;
      }
    }, this);

    // done, unpause the dataset
    this.model.play();

    if (widgetNeedsData) {
      app.me.dataview.getAllData();
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
