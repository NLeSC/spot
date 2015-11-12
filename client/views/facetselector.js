var View = require('ampersand-view');
var templates = require('../templates');

var itemView = View.extend({
    template: '<li class="mdl-menu__item" data-hook="item"></li>',
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
    events: {
        'click [data-hook~="item"]': 'clickItem',
    },
    clickItem: function () {
        this.parent.callback(this.model);
    },
});

module.exports = View.extend({
    template: templates.includes.facetselector,
    bindings: {
        'cid' : [
            {
                type: 'attribute',
                hook: 'button',
                name: 'id',
            },
            {
                type: 'attribute',
                hook: 'ul',
                name: 'for',
            },
        ],
        'icon': {
            type: 'text',
            hook: 'icon',
        },
    },
    initialize: function (options) {
        this.icon = options.icon;
        this.callback = options.callback;
    },
    render: function() {
        this.renderWithTemplate(this);
        this.renderCollection(this.collection, itemView, '[data-hook=ul]');

        return this;
    },
});
