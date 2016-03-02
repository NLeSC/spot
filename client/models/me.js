var AmpersandModel = require('ampersand-model');
var Collection = require('ampersand-collection');

module.exports = AmpersandModel.extend({
    type: 'user',
    props: {
        anim_speed: ['number', true, 500],  // Global value for animation speed (0 == off)

        data_url: ['string', true, 'data/data.json' ],
        // data_url: ['string', true, 'data/exp.json'],

        // description_url: ['string', true, 'data/exp_description.json'],
        description_url: ['string', true, 'data/data_description.json'],

    },
    collections: { 
        widgets: Collection,
        bookmarked: Collection,
    },
});
