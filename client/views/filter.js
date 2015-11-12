var View = require('ampersand-view');
var templates = require('../templates');
var app = require('ampersand-app');
var util = require('../util');

module.exports = View.extend({
    template: templates.includes.filter,
    bindings: {
        'model.name': '[data-hook~=name]',
        'model.description': '[data-hook~=description]',
        'model.units': '[data-hook~=units]',
        'model.show': {
            type: 'toggle',
            hook: 'fullitem',
        },
        // needed to link up the mdl javascript on the card
        'model.id': [
            {
                type: 'attribute',
                hook: 'label',
                name: 'for',
            },
            {
                type: 'attribute',
                hook: 'input',
                name: 'id',
            },
        ],
        // turn on/off the facet
        'model.active': [
//            {
//                type: 'booleanClass',
//                hook: 'title',
//                yes:  'mdl-color--accent',
//            },
//            {
//                type: 'booleanClass',
//                hook: 'name',
//                yes:  'mdl-color-text--accent-contrast',
//            },
//            {
//                type: 'booleanClass',
//                hook: 'units',
//                yes:  'mdl-color-text--accent-contrast',
//            },
            {
                type: 'booleanAttribute',
                hook: 'input',
                name: 'checked',
            },
            {
                type: 'booleanClass',
                hook: 'description',
                yes: 'mdl-color-text--accent',
            },
        ],
    },
    events: {
        'change [data-hook~=input]':    'handleToggle',
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
    },
});
