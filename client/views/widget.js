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
        this.remove();
    },
    handleChange:  function (e) {
        var select = this.el.querySelector('select');
        var id = select.options[select.selectedIndex].value;
        this.widget.model.filter = window.app.filters.get(id);
    },
    render: function() {
        this.renderWithTemplate(this);
        this.renderCollection(this.collection, 
                              filterItemView,
                              this.queryByHook('filter-selector'),
                              {filter: function (f) {return f.active;}});

        return this;
    },
    subviews: {
        widget: {
            hook: 'widget',
            constructor: function(options) {
                var c = options.parent.model.get('contentView');
                var m = options.parent.model.get('contentModel');
                options.model = new m();
                return new c(options);
            },
        },
    },
});
