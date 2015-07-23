var View = require('ampersand-view');
var templates = require('../templates');
var app = require('ampersand-app');
var util = require('../util');

module.exports = View.extend({
    template: templates.includes.filter,
    bindings: {
        'model.name': '[data-hook~=name]',
        'model.description': '[data-hook~=description]',
        'model.show': {
            type: 'toggle',
            hook: 'fullitem',
        },
        'model.active': [
            {
                type: 'booleanClass',
                hook: 'fullitem',
                yes: 'list-group-item-danger',
            },
            {
                type: 'booleanClass',
                hook: 'filter-button',
                no: 'btn-danger',
                yes: 'btn-default',
            },
        ],
    },
    events: {
        'click [data-hook~=filter-button]':    'handleToggle',
    },
    handleToggle: function () {
        if (this.model.active) {
            // Remove filter
            util.disableFilter(this.model.id);
        }
        else {
            // Add filter
            util.enableFilter(this.model.id);
        }

        this.collection.sort();
    },
});
