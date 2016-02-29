var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
    template: templates.includes.facetseditreduction,
    bindings: {
        'model.reduceCount': {
            type: 'booleanAttribute',
            hook: 'reduction-count-input',
            name: 'checked',
        },
        'model.reduceSum': {
            type: 'booleanAttribute',
            hook: 'reduction-sum-input',
            name: 'checked',
        },
        'model.reduceAverage': {
            type: 'booleanAttribute',
            hook: 'reduction-average-input',
            name: 'checked',
        },

        'model.reduceAbsolute': {
            type: 'booleanAttribute',
            hook: 'reduction-type-absolute-input',
            name: 'checked',
        },
        'model.reducePercentage': {
            type: 'booleanAttribute',
            hook: 'reduction-type-percentage-input',
            name: 'checked',
        },
    },
    events: {
        'click [data-hook~=reduction-count-input]': function () {
            this.model.reduction = 'count';
        },
        'click [data-hook~=reduction-sum-input]': function () {
            this.model.reduction = 'sum';
        },
        'click [data-hook~=reduction-average-input]': function () {
            this.model.reduction = 'average';
        },
        'click [data-hook~=reduction-type-absolute-input]': function () {
            this.model.reduction_type = 'absolute';
        },
        'click [data-hook~=reduction-type-percentage-input]': function () {
            this.model.reduction_type = 'percentage';
        },
    }
});
