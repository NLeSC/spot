var Collection = require('ampersand-collection');
var Aggregate = require('../aggregate');

module.exports = Collection.extend({
  model: Aggregate,
  indexes: ['rank'],
  comparator: 'rank'
});
