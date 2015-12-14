var View = require('ampersand-view');
var templates = require('../templates');
var app = require('ampersand-app');
var util = require('../util');

module.exports = View.extend({
    template: templates.includes.facet,
    bindings: {
        'model.name': '[data-hook~=name]',
        'model.description': '[data-hook~=description]',
        'model.units': '[data-hook~=units]',
        'model.show': {
            type: 'toggle',
            hook: 'fullitem',
        },
        'model.editURL': {
            type: 'attribute',
            hook: 'edit',
            name: 'href',
        },
        // turn on/off the facet
        'model.active': [
            {
                type: 'booleanClass',
                hook: 'description',
                yes: 'mdl-color-text--accent',
            },
        ],
    },
    events: {
        'click [data-hook~=power]':    'togglePower',
    },
    togglePower: function () {
        this.model.active = ! this.model.active;
    },
});
