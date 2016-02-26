var Collection = require('ampersand-rest-collection');
var Facet = require('./facet');

module.exports = Collection.extend({
    model: Facet,
    url : 'data/data_description.json',
    comparator: function (left, right) {
        return left.name.localeCompare(right.name);
    }
});
