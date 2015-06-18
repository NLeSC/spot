var AmpersandModel = require('ampersand-model');

module.exports = AmpersandModel.extend({
    props: {
        id: ['string', true, ''],
        name: ['string', true, ''],
        units: ['string', true, ''],
        description: ['string', true, ''],
        show: [ 'boolean', false, true ],
        active: [ 'boolean', false, false ],
    }
});
