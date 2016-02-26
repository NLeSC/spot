var AmpersandModel = require('ampersand-model');
var Collection = require('ampersand-collection');

module.exports = AmpersandModel.extend({
    type: 'user',
    props: {
        anim_speed: ['number', true, 500],  // Global value for animation speed (0 == off)
    },
    collections: { 
        widgets: Collection,
        bookmarked: Collection,
    },
});
