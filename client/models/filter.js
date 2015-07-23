var AmpersandModel = require('ampersand-model');

module.exports = AmpersandModel.extend({
    props: {
        id: ['string', true, ''],
        name: ['string', true, ''],
        units: ['string', true, ''],
        description: ['string', true, ''],
        show: [ 'boolean', false, true ],
        active: [ 'boolean', false, false ],
        _dx: [ 'any', false, false ],
    },
    derived: {
        // Returns true  for ordinal data (ie. categories),
        //         false for numeric data
        isOrdinal: {
            deps: ['units'],
            fn: function () {
                if( this.units == "naam" ||
                    this.units == "code" ) {
                    return true;
                }
                return false;
            },
        },
    },
});
