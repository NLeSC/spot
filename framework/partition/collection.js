var Collection = require('ampersand-collection');
var Partition = require('../partition');

module.exports = Collection.extend({
  model: Partition,
  indexes: ['rank'],
  comparator: 'rank'
});
