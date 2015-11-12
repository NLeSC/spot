var app = require('ampersand-app');
var View = require('ampersand-view');
var bookmarksView = require('../views/bookmarks');
var PageView = require('./base');
var templates = require('../templates');
var widgetView = require('../views/widget');
var widgetFactory = require('../widget_factory');

var dc = require('dc');

var widgetSelectorItemView = View.extend({
    template: templates.includes.widgetselectoritem,
    bindings: {
        'model.type': {
            type: 'text',
            hook: 'item'
        },
    },
    events: {
        'click [data-hook~=item]':    'handleClick',
    },
    handleClick:  function () {
        // Create a new widgetModel, and keep a reference to it
        var m = app.widgetFactory.newModel({'type': this.model.type});
        this.parent.collection.add( m );

        // Create a view for it, and render it
        var v = new widgetView({'model': m});
        this.parent.renderSubview(v, this.parent.queryByHook('widgets'));

        // And render it's content
        if (v.renderContent) {
            v.renderContent(v);
        }

        // clean up when it is removed from view
        var that = this.parent.collection;
        m.on( "removeWidget", function(m) {that.remove(m);} );

        // Update all dynamic MLD javascript things
        window.componentHandler.upgradeDom();
    },
});

module.exports = PageView.extend({
    pageTitle: 'more info',
    template: templates.pages.analyze,

    render: function() {
        this.renderWithTemplate(this);
        this.renderCollection(app.widgetFactory.widgets,
                              widgetSelectorItemView,
                              this.queryByHook('widget-selector'));

        // Create views for each widget, and render it
        this.collection.forEach(function(m) {
            var v = new widgetView({'model': m});
            this.renderSubview(v, this.queryByHook('widgets'));
        }, this);

        return this;
    },

    renderContent: function (view) {
        view._subviews.forEach( function(v) {
            if (v.renderContent) {
                v.renderContent(v);
            }
        });

        // make sure all widgets are in sync
        dc.redrawAll();
    },
    subviews: {
        widget: {
            hook: 'bookmarks',
            constructor: bookmarksView,
        },
    }
});
