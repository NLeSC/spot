var View = require('ampersand-view');
var templates = require('../templates');
var app = require('ampersand-app');

var filterItemView = View.extend({
    template: '<option data-hook="item"></option>',
    bindings: {
        'model.name': {
            type: 'text',
            hook: 'item',
        },
        'model.active': {
            type: 'toggle',
            hook: 'item',
        },
        'model.id': {
            type: 'value',
            hook: 'item',
        },
    },
});

module.exports = View.extend({
    template: templates.includes.widget,
    initialize: function (options) {
        this.collection = app.filters;
    },
    events: {
        'click [data-hook~="close"]': 'handleClose',
        'change': 'handleChange',
    },
    handleClose: function () {
        this.model.trigger( 'removeWidget', this.model );
        this.remove();
    },
    handleChange:  function (e) {
        var select = this.el.querySelector('select');
        this.model.filter = select.options[select.selectedIndex].value;

        this.renderContent();
    },
    render: function() {
        this.renderWithTemplate(this);
        this.renderCollection(this.collection, 
                              filterItemView,
                              this.queryByHook('filter-selector'),
                              {filter: function (f) {return f.active;}});


        // Fill in previously selected value
        var select = this.el.querySelector('select');
        select.value = this.model.filter;

        return this;
    },
    renderContent: function () {
        this.widget.renderContent();
    },
    subviews: {
        widget: {
            hook: 'widget',
            constructor: function(options) {
                options.type = options.parent.model.type;
                options.model = options.parent.model;

                return app.widgetFactory.newView(options.parent.model.type, options);
            },
        },
    },
});
