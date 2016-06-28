var Collection = require('ampersand-collection');
var Filter = require('./filter');

module.exports = Collection.extend({
  mainIndex: 'id',
  model: Filter
});
