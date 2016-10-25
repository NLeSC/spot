var Collection = require('ampersand-collection');
var Filter = require('../filter');

module.exports = Collection.extend({
  mainIndex: 'id',
  model: Filter,
  comparator: function (a, b) {
    if (a.row > b.row || a.row === b.row && a.col > b.col) {
      return 1;
    }
    if (a.col === b.col) {
      return 0;
    }
    return -1;
  }
});
