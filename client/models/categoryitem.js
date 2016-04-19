var AmpersandModel = require('ampersand-model');

// Data structure for working with categorial data
// it helps with mapping a dataitem (category) on a group
module.exports = AmpersandModel.extend({
    props: {
        category: ['string', true, ''], // string format of regexp to match data against
        count: ['number', true, 0],     // number of items in this category
        group: ['string', true, ''],    // name of the group this is mapped to
    },
    derived: {
        category_regexp: {
            deps: ['category'],
            fn: function () {
                return new RegExp(this.category);
            }
        },
    },
});
