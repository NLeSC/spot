var Collection = require('ampersand-collection');
var Facet = require('../facet');

module.exports = Collection.extend({
  model: Facet,
  mainIndex: 'id',
  indexes: ['name'],
  session: {
    needle: ['string', true, ''], // search string used on the Facet page
    showSearch: ['boolean', true, false] // show/hide the search bar on the Facet page
  },
  comparator: function (left, right) {
    return left.name.localeCompare(right.name);
  }
});
