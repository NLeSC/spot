var Collection = require('ampersand-collection');
var Group = require('./group');

module.exports = Collection.extend({
  indexes: ['value'],
  model: Group
});
