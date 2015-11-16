var AmpersandModel = require('ampersand-model');

module.exports = AmpersandModel.extend({
    props: {
        id: ['string', true, ''],
        name: ['string', true, ''],
        units: ['string', true, ''],
        description: ['string', true, ''],

        isContinuous: ['boolean',true,true], // categorial, continuous
        isExtensive: ['boolean','true',false], // extensive->reduce by sum, intensive->reduce by count
        type: ['string',true,"float"], // integer, string, float, formula
        accessor: ['string','true',''], // property, index, formula

        show: [ 'boolean', false, true ],
        active: [ 'boolean', false, false ],
        _dx: [ 'any', false, false ],
        _range: [ 'any', false ],
    },
    derived: {
        isCategorial: {
            deps: ['isContinuous'],
            fn: function () {
                return ! this.isContinuous;
            }
        },
        isIntensive: {
            deps: ['isExtensive'],
            fn: function () {
                return ! this.isExtensive;
            }
        },
        isInteger: {
            deps: ['type'],
            fn: function () {
                return this.type == 'integer';
            }
        },
        isFloat: {
            deps: ['type'],
            fn: function () {
                return this.type == 'float';
            }
        },
        isString: {
            deps: ['type'],
            fn: function () {
                return this.type == 'string';
            }
        },
        isFormula: {
            deps: ['type'],
            fn: function () {
                return this.type == 'formula';
            }
        },
        editURL: {
            deps: ['id'],
            fn: function () {
                return '/facets/' + this.id;
            }
        },
    },
});
