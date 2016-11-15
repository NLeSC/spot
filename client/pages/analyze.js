var $ = require('jquery');
var PageView = require('./base');
var templates = require('../templates');
var WidgetFrameView = require('./analyze/widget-frame');
var FacetbarItemView = require('./analyze/facetbar-item');
var sortablejs = require('sortablejs');

// NOTE: gridster does not work properly with require()
// workaround via browserify-shim (configured in package.json)
require('gridster');

function addWidgetForFilter (view, filter) {
  var gridster = view._widgetsGridster;
  var row = filter.row || 1;
  var col = filter.col || 1;
  var sizeX = filter.size_x || 3;
  var sizeY = filter.size_y || 3;

  var el = gridster.add_widget('<div class="widgetOuterFrame"></div>', sizeX, sizeY, col, row);
  var subview = new WidgetFrameView({
    model: filter
  });

  // render, and render content of widget frame,
  // this will also trigger a render of the widget's content
  view.renderSubview(subview, el[0]);
  subview.renderContent();

  // link element and view so we can:
  // a) on remove, get to the HTMLElement from the WidgetFrameView
  // b) on resize, get to the WidgetFrameView from the HTMLElement
  subview.gridsterHook = el[0];
  $(el[0]).data('spotWidgetFrameView', subview);
}

module.exports = PageView.extend({
  pageTitle: 'more info',
  template: templates.analyze,
  derived: {
    dataString: {
      deps: ['model.dataTotal', 'model.dataSelected', 'model.editMode'],
      fn: function () {
        if (this.model.editMode) {
          return 'Click anywhere on this bar when ready';
        } else {
          var percentage;
          if (this.model.dataTotal > 0) {
            percentage = 100.0 * this.model.dataSelected / this.model.dataTotal;
          } else {
            percentage = 0;
          }
          return this.model.dataTotal + ' total, ' + this.model.dataSelected + ' selected (' + percentage.toPrecision(3) + '%)';
        }
      }
    }
  },
  bindings: {
    'model.editMode': [
      { type: 'toggle', hook: 'chart-bar' },
      { type: 'toggle', hook: 'facet-bar' }
    ],
    'dataString': {
      type: 'text',
      hook: 'data-string'
    }
  },
  events: {
    'click header': 'toggleChartBar',
    'click .chartIcon': 'addChart'
  },
  addChart: function (ev) {
    // what icon was clicked?
    var target = ev.target || ev.srcElement;
    var id = target.id;

    var filter = this.model.filters.add({ chartType: id });
    addWidgetForFilter(this, filter);
  },
  toggleChartBar: function () {
    // toggle mode, and propagate to children
    this.model.editMode = !this.model.editMode;
    if (this._subviews) {
      var state = this.model.editMode;
      this._subviews.forEach(function (v) {
        v.editMode = state;
      });
    }

    var gridster = this._widgetsGridster;
    if (this.model.editMode) {
      gridster.enable();
      gridster.enable_resize();
    } else {
      gridster.disable();
      gridster.disable_resize();
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
        put: true
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
        handle: '.dragHere',
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
          view.update();

          // keep track of the position of the chart
          var info = widget.data('coords').grid;
          filter.row = info.row;
          filter.col = info.col;
          filter.size_x = info.size_x;
          filter.size_y = info.size_y;
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

      if (!filter.data) {
        widgetNeedsData = true;
      }
    }, this);

    // done, unpause the dataset
    this.model.play();

    if (widgetNeedsData) {
      this.model.getAllData(this.model);
    }
  }
});
