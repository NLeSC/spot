var AmpersandModel = require('ampersand-model');
var Widgets = require('./widget-collection');

module.exports = AmpersandModel.extend({
    type: 'user',
    props: {
        anim_speed: ['number', true, 500],  // Global value for animation speed (0 == off)
        data_url: ['string', true, '' ],
        dataset: ['any', false, null],
    },
    collections: { 
        widgets: Widgets,
        bookmarked: Widgets,
    },
});
