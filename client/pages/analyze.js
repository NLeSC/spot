var View = require('ampersand-view');
var bookmarksView = require('../views/bookmarks');
var PageView = require('./base');
var templates = require('../templates');
var WidgetFrameView = require('../views/widget-frame');
var Filter = require('../models/filter');
var app = require('ampersand-app');

function addWidget (view, dataset, filter) {
  // Create a new chart model
  var m = app.widgetFactory.newModel({
    modelType: filter.chartType,
    filter: filter,
    filterId: filter.id
  });

  // Create an Ampersand view for it
  var v = new WidgetFrameView({
    model: m,
    dataset: dataset
  });

  // and render it
  view.renderSubview(v, view.queryByHook('widgets'));

  return v;
}

// this -> element of app.widgetFactory.widgets
var widgetSelectorItemView = View.extend({
  template: templates.includes.widgetselectoritem,
  bindings: {
    'model.modelType': {
      type: 'text',
      hook: 'item'
    }
  },
  events: {
    'click [data-hook~=item]': 'handleClick'
  },
  initialize: function (opts) {
    this.pageView = opts.pageView;
    this.dataset = opts.dataset;
  },
  handleClick: function () {
    // Create a filter, and add it to the datasets' filter collection
    var f = new Filter({
      chartType: this.model.modelType
    });
    this.dataset.filters.add(f);
    var v = addWidget(this.pageView, this.dataset, f);

    // Update all dynamic MLD javascript things
    window.componentHandler.upgradeDom();

    // And render it's content
    if (v.renderContent) {
      v.renderContent();
    }
  }
});

module.exports = PageView.extend({
  pageTitle: 'more info',
  template: templates.pages.analyze,

  render: function (opts) {
    this.renderWithTemplate(this);

    opts.viewOptions = {
      pageView: this,
      dataset: this.model
    };

    // render the available widgets in the list under the FAB button
    this.renderCollection(
      app.widgetFactory.widgets,
      widgetSelectorItemView,
      this.queryByHook('widget-selector'),
      opts
    );

    // Create views for each widget
    this.model.filters.forEach(function (filter) {
      addWidget(this, this.dataset, filter);
    }, this);

    // Sprinkle MDL over the page
    window.componentHandler.upgradeElement(this.queryByHook('widgets'));

    return this;
  },

  renderContent: function () {
    this.model.pause();
    this._subviews.forEach(function (v) {
      if (v.renderContent) {
        v.renderContent();
      }
    });
    this.model.play();

    this.model.getAllData(this.model);
  },
  subviews: {
    widget: {
      hook: 'bookmarks',
      constructor: bookmarksView
    }
  }
});
