var AmpersandModel = require('ampersand-model');

module.exports = AmpersandModel.extend({
    type: 'user',
    props: {
        anim_speed: ['number', true, 500],  // Global value for animation speed (0 == off)
    },
});
