var Collection = require('ampersand-collection');
var Dataset = require('../dataset');

module.exports = Collection.extend({
  mainIndex: 'id',
  model: Dataset
});
