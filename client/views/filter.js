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
            this.model._dx.dispose();
            delete this.model._dx;
        }
        else {
            // Add filter

            // FIXME: data keys are assumed to be lower case, but this is not checked/ensured
            var key = this.model.id.toLowerCase();

            this.model._dx = app.crossfilter.dimension(function(d) {return util.validateFloat(d[key]);} );
        }

        this.model.active = this.model.active ? false : true;
        this.collection.sort();
    },
});
