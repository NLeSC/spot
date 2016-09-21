var PageView = require('./base');
var templates = require('../templates');
var WidgetFrameView = require('../views/widget-frame');
var Filter = require('../models/filter');
var FacetBarItemView = require('../views/facetbaritem');

module.exports = PageView.extend({
  pageTitle: 'more info',
  template: templates.pages.analyze,
  props: {
    showChartBar: ['boolean', true, true],
    showFacetBar: ['boolean', true, true]
  },
  bindings: {
    'showChartBar': {
      type: 'toggle',
      hook: 'chart-bar'
    },
    'showFacetBar': {
      type: 'toggle',
      hook: 'facet-bar'
    }
  },
  events: {
    'click [data-hook~=chartbar-button]': 'toggleChartBar',
    'click [data-hook~=facetbar-button]': 'toggleFacetBar',
    'dragstart .chartBar': 'dragChartStart',
    'dragstart .facetBar': 'dragFacetStart',

    'dragover .widgetDropZone': 'allowWidgetDrop',
    'drop .widgetDropZone': 'dropWidget'
  },
  dragFacetStart: function (ev) {
    ev.dataTransfer.setData('text', ev.target.id);
  },
  dragChartStart: function (ev) {
    ev.dataTransfer.setData('text', ev.target.id);
  },
  allowWidgetDrop: function (ev) {
    ev.preventDefault();
  },
  dropWidget: function (ev) {
    var content = ev.dataTransfer.getData('text').split(':');

    if (content[0] === 'emptychart') {
      // A chart dropped from the chartbar

      // Create a filter, and add it to the datasets' filter collection
      var f = new Filter({
        chartType: content[1]
      });
      if (!f) {
        // cannot get the chart?
        console.error('Cannot construct filter for chart type', content[1]);
        return;
      }
      this.model.filters.add(f);

      // Update all dynamic MLD javascript things
      window.componentHandler.upgradeDom();

      // And render it's content
      // view -> CollectionView -> WidgetFrameView
      var widgets = this._subviews[0].views;
      widgets[widgets.length - 1].renderContent();
    } else if (content[0] === 'filter') {
      // A facet dropped from a widget frame, remove it from that frame
      var sourceFilter = this.model.filters.get(content[2]);
      if (content[1] === 'primary') {
        sourceFilter.primary = null;
      } else if (content[1] === 'secondary') {
        sourceFilter.secondary = null;
      } else if (content[1] === 'tertiary') {
        sourceFilter.tertiary = null;
      }
      sourceFilter.initDataFilter();
    } else {
      // dropped something else, ignore it
      return;
    }

    // All OK
    ev.preventDefault();
    ev.stopPropagation();
  },
  toggleChartBar: function () {
    this.showChartBar = !this.showChartBar;
  },
  toggleFacetBar: function () {
    this.showFacetBar = !this.showFacetBar;
    if (this._subviews) {
      var state = this.showFacetBar;
      this._subviews[0].views.forEach(function (v) {
        v.showFacetBar = state;
      });
    }
  },
  render: function (opts) {
    this.renderWithTemplate(this);

    this.renderCollection(this.model.filters, WidgetFrameView, this.queryByHook('widgets'));
    this.renderCollection(this.model.facets, FacetBarItemView, this.queryByHook('facet-bar-items'), {
      filter: function (m) {
        return m.isActive;
      }
    });

    // Sprinkle MDL over the page
    window.componentHandler.upgradeElement(this.queryByHook('widgets'));

    return this;
  },

  renderContent: function () {
    if (this._subviews) {
      this.model.pause();
      this._subviews[0].views.forEach(function (v) {
        v.renderContent();
      });
      this.model.play();
    }
  }
});
