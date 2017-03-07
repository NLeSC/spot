var Collection = require('ampersand-collection');
var Group = require('./group');

module.exports = Collection.extend({
  indexes: ['value', 'label', 'group', 'groupIndex'],
  model: Group,
  comparator: 'label',
  initialize: function (attrs, options) {
    this.parent.on('change ordering', this.setOrdering, this);
    this.setOrdering();
    this.on('sort', function () {
      this.forEach(function (group, i) {
        group.groupIndex = i;
      });
    }, this);
  },
  setOrdering: function () {
    var order = this.parent.ordering;

    if (order === 'count') {
      this.comparator = function (a, b) {
        if (a.count === b.count) {
          return a.value < b.value ? -1 : 1;
        } else {
          return b.count - a.count;
        }
      };
    } else if (order === 'abc') {
      this.comparator = 'value';
    }
    this.sort();
  }
});
