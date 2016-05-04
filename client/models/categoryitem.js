var AmpersandModel = require('ampersand-model');

// Data structure for working with categorial data
// it helps with mapping a dataitem (category) on a group
module.exports = AmpersandModel.extend({
    dataTypes: {
        // string or number allowed, but stored as number
        numberorstring: {
            set: function (newVal) {
                var val;
                try {
                    val = parseInt(newVal);
                    return {type: 'numberorstring', val: val};
                }
                catch (anyError) {
                    throw new TypeError("Cannot make number from", newVal);
                }
            },
            compare: function (currentVal, newVal, attributeName) {
                var cv, nv;
                try {
                    cv = parseInt(curentVal);
                    nv = parseInt(newVal);
                    return cv == nv;
                }
                catch (anyError) {
                    return false;
                }
            },
        },
    },
    props: {
        category: ['string', false, 'Missing'], // string format of regexp to match data against
        count: ['numberorstring', true, 0],     // number of items in this category
        group: ['string', false, 'Missing'],    // name of the group this is mapped to
    },
    // derived: {
    //     category_regexp: {
    //         deps: ['category'],
    //         fn: function () {
    //             return new RegExp(this.category);
    //         }
    //     },
    // },
});
