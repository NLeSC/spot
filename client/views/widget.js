var View = require('ampersand-view');
var templates = require('../templates');
var app = require('ampersand-app');

var FilterItemView = View.extend({
    template: '<option data-hook="item"></option>',
    events: {
        'click [data-hook~=filteritem]':    'handleClick',
    },
    handleClick:  function () {
        console.log( "something clikceyed");
    },
    bindings: {
        'model.name': {
            type: 'text',
            hook: 'item',
        },
        'model.active': {
            type: 'toggle',
            hook: 'item',
        },
    },
});

module.exports = View.extend({
    template: templates.includes.widget,
    initialize: function () {
        this.collection = app.filters;
    },
    render: function() {
        this.renderWithTemplate(this);
        this.renderCollection(this.collection, 
                              FilterItemView,
                              this.queryByHook('filter-selector'),
                              {filter: function (f) {return f.active;}});
        return this;
    },
});
