var app = require('ampersand-app');
var View = require('ampersand-view');
var PageView = require('./base');
var templates = require('../templates');
var widgetView = require('../views/widget');
var widgetFactory = require('../widget_factory');

var Collection = require('ampersand-collection');
var _widgets = new Collection();

var widgetSelectorItemView = View.extend({
    template: '<button type="button" class="btn btn-default" data-hook="item"></button>',
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
        _widgets.add( m );

        // Create a view for it, and render it
        var v = new widgetView({'model': m});
        this.parent.renderSubview(v, this.parent.queryByHook('widgets'));

        // clean up when it is removed from view
        m.on( "removeWidget", function(m) {_widgets.remove(m);} );
    },
});

module.exports = PageView.extend({
    pageTitle: 'more info',
    template: templates.pages.info,

    render: function() {
        this.renderWithTemplate(this);
        this.renderCollection(app.widgetFactory.widgets,
                              widgetSelectorItemView,
                              this.queryByHook('widget-selector'));

        // Create views for each widget, and render it
        _widgets.forEach( function(m) {
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
    },
});
