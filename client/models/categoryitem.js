var AmpersandModel = require('ampersand-model');

module.exports = AmpersandModel.extend({
    props: {
        category: ['any', true, ''],
        count: ['number', true, 0],
        group: ['any', true, ''],
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
