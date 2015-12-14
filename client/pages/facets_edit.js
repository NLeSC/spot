var PageView = require('./base');
var templates = require('../templates');

module.exports = PageView.extend({
    pageTitle: 'Facets - Edit',
    template: templates.pages.facetsedit,
    bindings: {
        'model.name': {
            type: 'value',
            hook: 'title-input'
        },
        'model.units': {
            type: 'value',
            hook: 'units-input'
        },
        'model.description': {
            type: 'value',
            hook: 'description-input',
        },
        'model.accessor': {
            type: 'value',
            hook: 'property-input',
        },
        'model.isContinuous': [
            {
                type: 'booleanClass',
                hook: 'tab-continuous',
                name: 'is-active',
            },
            {
                type: 'booleanClass',
                hook: 'panel-continuous',
                name: 'is-active',
            }
        ],
        'model.minval_astext' : {
            type: 'value',
            hook: 'minval-input',
        },
        'model.maxval_astext' : {
            type: 'value',
            hook: 'maxval-input',
        },
        'model.misval_astext': {
            type: 'value',
            hook: 'misval-input',
        },
        'model.group_param' : {
            type: 'value',
            hook: 'grouping-param-input',
        },
        'model.isCategorial': [
            {
                type: 'booleanClass',
                hook: 'tab-categorial',
                name: 'is-active',
            },
            {
                type: 'booleanClass',
                hook: 'panel-categorial',
                name: 'is-active',
            }
        ],

        'model.isFixedN': {
            type: 'booleanAttribute',
            hook: 'grouping-fixedn',
            name: 'checked',
        },
        'model.isFixedS': {
            type: 'booleanAttribute',
            hook: 'grouping-fixeds',
            name: 'checked',
        },
        'model.isFixedSC': {
            type: 'booleanAttribute',
            hook: 'grouping-fixedsc',
            name: 'checked',
        },
        'model.isLog': {
            type: 'booleanAttribute',
            hook: 'grouping-log',
            name: 'checked',
        },
        'model.isPercentile': {
            type: 'booleanAttribute',
            hook: 'grouping-percentile',
            name: 'checked',
        },
        'model.isExceendence': {
            type: 'booleanAttribute',
            hook: 'grouping-exceedence',
            name: 'checked',
        },

        'model.reduceCount': {
            type: 'booleanAttribute',
            hook: 'reduce-count',
            name: 'checked',
        },
        'model.reduceSum': {
            type: 'booleanAttribute',
            hook: 'reduce-sum',
            name: 'checked',
        },
        'model.mapNone': {
            type: 'booleanAttribute',
            hook: 'map-none',
            name: 'checked',
        },
        'model.mapPercentiles': {
            type: 'booleanAttribute',
            hook: 'map-percentiles',
            name: 'checked',
        },

        'model.isInteger': {
            type: 'booleanAttribute',
            hook: 'type-integer',
            name: 'checked',
        },
        'model.isFloat': {
            type: 'booleanAttribute',
            hook: 'type-float',
            name: 'checked',
        },
        'model.isString': {
            type: 'booleanAttribute',
            hook: 'type-string',
            name: 'checked',
        },
        'model.isFormula': {
            type: 'booleanAttribute',
            hook: 'type-formula',
            name: 'checked',
        },
    },
    events: {
        'change [data-hook~=title-input]': 'changeTitle',
        'change [data-hook~=units-input]': 'changeUnits',
        'change [data-hook~=description-input]': 'changeDescription',
        'change [data-hook~=property-input]': 'changeAccessor',

        'change [data-hook~=minval-input]': 'changeMinval',
        'change [data-hook~=maxval-input]': 'changeMaxval',
        'change [data-hook~=misval-input]': 'changeMisval',

        'change [data-hook~=grouping-param-input]': 'changeGroupParam',

        'click [data-hook~=tab-categorial]': 'changeCategorial',
        'click [data-hook~=tab-continuous]': 'changeContinuous',

        'change [data-hook~=grouping-fixedn]': 'changeFixedN',
        'change [data-hook~=grouping-fixeds]': 'changeFixedS',
        'change [data-hook~=grouping-fixedsc]': 'changeFixedSC',
        'change [data-hook~=grouping-log]': 'changeLog',
        'change [data-hook~=grouping-percentile]': 'changePercentile',
        'change [data-hook~=grouping-exceedence]': 'changeExceedence',

        'change [data-hook~=reduce-count]': 'changeCount',
        'change [data-hook~=reduce-sum]': 'changeSum',

        'change [data-hook~=type-integer]': 'changeInteger',
        'change [data-hook~=type-float]': 'changeFloat',
        'change [data-hook~=type-string]': 'changeString',
        'change [data-hook~=type-formula]': 'changeFormula',
    },
    changeTitle: function () {
        this.model.name = this.queryByHook( 'title-input' ).value;
    },
    changeUnits:function ()  {
        this.model.units = this.queryByHook( 'units-input' ).value;
    },
    changeDescription: function () {
        this.model.description = this.queryByHook( 'description-input' ).value;
    },
    changeAccessor: function () {
        this.model.accessor = this.queryByHook( 'property-input' ).value;
    },

    changeMinval: function () {
        this.model.minval_astext = this.queryByHook( 'minval-input' ).value;
    },
    changeMaxval: function () {
        this.model.maxval_astext = this.queryByHook( 'maxval-input' ).value;
    },
    changeMisval: function () {
        this.model.misval_astext = this.queryByHook( 'misval-input' ).value;
    },
    changeGroupParam: function () {
        this.model.group_param = parseFloat( this.queryByHook( 'grouping-param-input' ).value );
    },

    changeCategorial: function () {
        this.model.isContinuous = false;
    },
    changeContinuous: function () {
        this.model.isContinuous = true;
    },

    changeFixedN: function () {
        this.model.grouping = 'fixedn';
    },
    changeFixedS: function () {
        this.model.grouping = 'fixeds';
    },
    changeFixedSC: function () {
        this.model.grouping = 'fixedsc';
    },
    changeLog: function () {
        this.model.grouping = 'log';
    },
    changePercentile: function () {
        this.model.grouping = 'percentile';
    },
    changeExceedence: function () {
        this.model.grouping = 'exceedence';
    },

    changeSum: function () {
        this.model.reduction = 'sum';
    },
    changeCount: function () {
        this.model.reduction = 'count';
    },

    changeInteger: function () {
        this.model.type = 'integer';
    },
    changeFloat: function () {
        this.model.type = 'float';
    },
    changeString: function () {
        this.model.type = 'string';
    },
    changeFormula: function () {
        this.model.type = 'formula';
    }
});
