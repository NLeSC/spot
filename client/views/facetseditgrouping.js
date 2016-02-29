var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
    template: templates.includes.facetseditgrouping,
    bindings: {
        'model.isCategorial': {
            type: 'toggle',
            hook: 'grouping-general-panel',
            invert: true,
        },

        // Bindings for: grouping
        'model.displayContinuous': {
            type: 'toggle',
            hook: 'grouping-continuous-panel',
        },
        'model.displayTime': {
            type: 'toggle',
            hook: 'grouping-time-panel',
        },
        
        // Bindings for: grouping-general
        'model.minval_astext': {
            type: 'value',
            hook: 'grouping-general-minimum-input',
        },
        'model.maxval_astext': {
            type: 'value',
            hook: 'grouping-general-maximum-input',
        },

        // Bindings for: grouping-continuous
        'model.grouping_continuous_bins': {
            type: 'value',
            hook: 'grouping-continuous-bins-input',
        },
        'model.groupFixedN': {
            type: 'booleanAttribute',
            hook: 'grouping-continuous-fixedn-input',
            name: 'checked',
        },
        'model.groupFixedSC': {
            type: 'booleanAttribute',
            hook: 'grouping-continuous-fixedsc-input',
            name: 'checked',
        },
        'model.groupFixedS': {
            type: 'booleanAttribute',
            hook: 'grouping-continuous-fixeds-input',
            name: 'checked',
        },
        'model.groupLog': {
            type: 'booleanAttribute',
            hook: 'grouping-continuous-log-input',
            name: 'checked',
        },

        // Bindings for: grouping-time
        'model.grouping_time_format': {
            type: 'value',
            hook: 'grouping-time-format-input',
        },
    },
    events: {
        // events for: grouping
        'change [data-hook~=grouping-general-minimum-input]': function () {
            this.model.minval_astext = this.queryByHook( 'grouping-general-minimum-input' ).value;
        },
        'change [data-hook~=grouping-general-maximum-input]': function () {
            this.model.maxval_astext = this.queryByHook( 'grouping-general-maximum-input' ).value;
        },
        'change [data-hook~=grouping-continuous-bins-input]': function () {
            this.model.grouping_continuous_bins = parseFloat(this.queryByHook( 'grouping-continuous-bins-input').value);
        },

        'click [data-hook~=grouping-continuous-fixedn-input]': function () {
            this.model.grouping_continuous = 'fixedn';
        },
        'click [data-hook~=grouping-continuous-fixedsc-input]': function () {
            this.model.grouping_continuous = 'fixedsc';
        },
        'click [data-hook~=grouping-continuous-fixeds-input]': function () {
            this.model.grouping_continuous = 'fixeds';
        },
        'click [data-hook~=grouping-continuous-log-input]': function () {
            this.model.grouping_continuous = 'log';
        },
        'change [data-hook~=grouping-time-format-input]': function () {
            this.model.grouping_time_format = this.queryByHook( 'grouping-time-format-input' ).value;
        },
    }
});
