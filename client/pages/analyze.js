var PageView = require('./base');
var templates = require('../templates');
var WidgetFrameView = require('../views/widget-frame');
var Filter = require('../models/filter');
var FacetbarItemView = require('../views/facetbar-item');

var $ = window.$;

function addWidget (view, filter) {
  var gridster = $('[id~=widgets]').gridster().data('gridster');
  var row = filter.row || 0;
  var col = filter.col || 0;
  var sizeX = filter.size_x || 3;
  var sizeY = filter.size_y || 3;

  var el = gridster.add_widget('<div class="widgetOuterFrame"></div>', sizeX, sizeY, row, col);
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
  template: templates.pages.analyze,
  props: {
    showChartBar: ['boolean', true, true]
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
        return this.model.dataTotal + ' total, ' + this.model.dataSelected + ' selected (' + percentage.toPrecision(3) + '%)';
      }
    }
  },
  bindings: {
    'showChartBar': [
      { type: 'toggle', hook: 'chart-bar' },
      { type: 'toggle', hook: 'facet-bar' }
    ],
    'dataString': {
      type: 'text',
      hook: 'data-string'
    }
  },
  events: {
    'click [data-hook~=chartbar-button]': 'toggleChartBar',
    'click [data-hook~=facetbar-button]': 'toggleFacetBar',
    'click .chartIcon': 'addChart',
    'dragstart .facetBar': 'dragFacetStart'
  },
  dragFacetStart: function (ev) {
    ev.dataTransfer.setData('text', ev.target.id);
  },
  addChart: function (ev) {
    // what icon was clicked?
    var target = ev.target || ev.srcElement;
    var id = target.id;

    // A chart icon was clicked:
    // .. create a filter
    // .. add to dataset
    // .. add to view

    var f = new Filter({ chartType: id });
    this.model.filters.add(f);
    addWidget(this, f);
  },
  toggleChartBar: function () {
    console.log(this);
    console.log(this.toJSON());
    // toggle mode, and propagate to children
    this.showChartBar = !this.showChartBar;
    if (this._subviews) {
      var state = this.showChartBar;
      this._subviews.forEach(function (v) {
        v.showChartBar = state;
      });
    }

    var gridster = $('[id~=widgets]').gridster().data('gridster');
    if (this.showChartBar) {
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
    this.model.pause();

    var gridster = $('[id~=widgets]').gridster({
      widget_base_dimensions: [100, 100],
      autogenerate_stylesheet: true,
      min_cols: 1,
      max_cols: 20,
      avoid_overlapped_widgets: true,
      widget_selector: 'div',
      draggable: {
        enabled: true,
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
          if (filter.isConfigured) {
            view.initChart();
            view.update();
          }

          // keep track of the position of the chart
          var info = widget.data('coords').grid;
          filter.col = info.col;
          filter.row = info.row;
          filter.size_x = info.size_x;
          filter.size_y = info.size_y;
        }
      }
    });

    // add widgets for each filter to the page
    this.model.filters.forEach(function (filter) {
      addWidget(this, filter);
    }, this);

    // initialize gridster with resize and drag
    gridster = $('[id~=widgets]').gridster().data('gridster');
    if (this.showChartBar) {
      gridster.enable();
      gridster.enable_resize();
    } else {
      gridster.disable();
      gridster.disable_resize();
    }

    // done, unpause the dataset
    this.model.play();
  }
});
