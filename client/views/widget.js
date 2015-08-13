var View = require('ampersand-view');
var filterItemView = require('./filteritem.js');
var templates = require('../templates');
var app = require('ampersand-app');
var dc = require('dc');


module.exports = View.extend({
    template: templates.includes.widget,
    initialize: function (options) {
        this.collection = app.filters;
    },
    events: {
        'click [data-hook~="close"]': 'closeWidget',
        'change [data-hook~="filter-selector"]': 'changeFilter',
    },
    closeWidget: function () {
        this.model.trigger( 'removeWidget', this.model );
        this.remove();
    },
    changeFilter:  function (e) {
        var select = this.el.querySelector('[data-hook~="filter-selector"]');
        this.model.filter = select.options[select.selectedIndex].value;

        this.renderContent(this);
    },
    render: function() {
        this.renderWithTemplate(this);
        this.renderCollection(this.collection, 
                              filterItemView,
                              this.queryByHook('filter-selector'),
                              {filter: function (f) {return f.active;}});


        var select = this.el.querySelector('select');
        select.value = this.model.filter;

        return this;
    },
    renderContent: function (view) {
        // Propagate to subview
        view.widget.renderContent(view.widget);
    },
    subviews: {
        widget: {
            hook: 'widget',
            constructor: function(options) {
                options.type = options.parent.model.type;
                options.model = options.parent.model;

                var subview = app.widgetFactory.newView(options.parent.model.type, options);

                return subview;
            },
        },
    },

});
