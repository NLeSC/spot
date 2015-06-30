var View = require('ampersand-view');
var templates = require('../templates');
var app = require('ampersand-app');

var FilterItemView = View.extend({
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
        'change':    'handleChange',
    },
    handleChange:  function (e) {
        var select = this.el.querySelector('select');
        var value = select.options[select.selectedIndex].value;
        this.widget.model.set('filter',  window.app.filters.get(value));
    },
    render: function() {
        this.renderWithTemplate(this);
        this.renderCollection(this.collection, 
                              FilterItemView,
                              this.queryByHook('filter-selector'),
                              {filter: function (f) {return f.active;}});

        return this;
    },
    subviews: {
        widget: {
            hook: 'widget',
            constructor: function(options) {
                var c = options.parent.model.get('contentConstructor');
                return new c(options);
            },
        },
    },
});
