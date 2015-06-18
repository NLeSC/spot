var Collection = require('ampersand-rest-collection');
var Filter = require('./filter.js');

module.exports = Collection.extend({
    model: Filter,
    url : 'data/data_description.json',
    comparator: function (left, right) {
        if (left.active  === true && right.active === false) return -1;
        if (right.active === true && left.active  === false) return  1;

        return left.name.localeCompare(right.name);
    }
});
