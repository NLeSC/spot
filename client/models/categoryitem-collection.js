var Collection = require('ampersand-collection');
var CategoryItem = require('./categoryitem');

module.exports = Collection.extend({
    model: CategoryItem,
});
