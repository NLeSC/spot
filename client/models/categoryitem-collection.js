var Collection = require('ampersand-collection');
var CategoryItem = require('./categoryitem');

module.exports = Collection.extend({
    model: CategoryItem,
    //initialize: function () {
    //    this.add([
    //        {original:'Hello', mapped:'World'},
    //        {original:'You', mapped:'Again'},
    //    ]);
    //},
});
