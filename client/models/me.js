var AmpersandModel = require('ampersand-model');
var Widgets = require('./widget-collection');
var Facets = require('./facet-collection');
var dc = require('dc');

module.exports = AmpersandModel.extend({
    type: 'user',
    props: {
        anim_speed: ['number', true, 500],  // Global value for animation speed (0 == off)
        data_url: ['string', true, '' ],
    },
    collections: { 
        facets: Facets,
        widgets: Widgets,
        bookmarked: Widgets,
    },
});
