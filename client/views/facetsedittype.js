var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
    template: templates.includes.facetsedittype,
    bindings: {
        'model.isContinuous': {
            type: 'booleanAttribute',
            hook: 'type-continuous',
            name: 'checked',
        },
        'model.isCategorial': {
            type: 'booleanAttribute',
            hook: 'type-categorial',
            name: 'checked',
        },
        'model.isSpatial': {
            type: 'booleanAttribute',
            hook: 'type-spatial',
            name: 'checked',
        },
        'model.isTime': {
            type: 'booleanAttribute',
            hook: 'type-time',
            name: 'checked',
        },
        'model.isNetwork': {
            type: 'booleanAttribute',
            hook: 'type-network',
            name: 'checked',
        },
    },
    events: {
        'click [data-hook~=type-continuous]': function () {
            this.model.type = 'continuous';
            this.model.transform = 'none';
        },
        'click [data-hook~=type-categorial]': function () {
            this.model.type = 'categorial';
            this.model.transform = 'none';
        },
        'click [data-hook~=type-spatial]': function () {
            this.model.type = 'spatial';
            this.model.transform = 'none';
        },
        'click [data-hook~=type-time]': function () {
            this.model.type = 'time';
            this.model.transform = 'none';
        },
        'click [data-hook~=type-network]': function () {
            this.model.type = 'network';
            this.model.transform = 'none';
        },
    }
});
