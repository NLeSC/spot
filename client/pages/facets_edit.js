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
        'model.isContinuous': {
            type: 'booleanAttribute',
            hook: 'option-continuous',
            name: 'checked',
        },
        'model.isCategorial': {
            type: 'booleanAttribute',
            hook: 'option-categorial',
            name: 'checked',
        },

        'model.isExtensive': {
            type: 'booleanAttribute',
            hook: 'option-extensive',
            name: 'checked',
        },
        'model.isIntensive': {
            type: 'booleanAttribute',
            hook: 'option-intensive',
            name: 'checked',
        },

        'model.isInteger': {
            type: 'booleanAttribute',
            hook: 'option-integer',
            name: 'checked',
        },
        'model.isFloat': {
            type: 'booleanAttribute',
            hook: 'option-float',
            name: 'checked',
        },
        'model.isString': {
            type: 'booleanAttribute',
            hook: 'option-string',
            name: 'checked',
        },
        'model.isFormula': {
            type: 'booleanAttribute',
            hook: 'option-formula',
            name: 'checked',
        },
    },
    events: {
        'change [data-hook~=title-input]': 'changeTitle',
        'change [data-hook~=units-input]': 'changeUnits',
        'change [data-hook~=description-input]': 'changeDescription',
        'change [data-hook~=property-input]': 'changeAccessor',

        'change [data-hook~=option-categorial]': 'changeCategorial',
        'change [data-hook~=option-continuous]': 'changeContinuous',

        'change [data-hook~=option-extensive]': 'changeExtensive',
        'change [data-hook~=option-intensive]': 'changeIntensive',

        'change [data-hook~=option-integer]': 'changeInteger',
        'change [data-hook~=option-float]': 'changeFloat',
        'change [data-hook~=option-string]': 'changeString',
        'change [data-hook~=option-formula]': 'changeFormula',
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

    changeCategorial: function () {
        this.model.isContinuous = false;
    },
    changeContinuous: function () {
        this.model.isContinuous = true;
    },

    changeExtensive: function () {
        this.model.isExtensive = true;
    },
    changeIntensive: function () {
        this.model.isExtensive = false;
    },

    changeInteger: function () {
        this.model.type = "integer";
    },
    changeFloat: function () {
        this.model.type = "float";
    },
    changeString: function () {
        this.model.type = "string";
    },
    changeFormula: function () {
        this.model.type = "formula";
    }
});
