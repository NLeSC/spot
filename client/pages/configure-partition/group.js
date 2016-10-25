var View = require('ampersand-view');
var templates = require('../../templates');

module.exports = View.extend({
  template: templates.includes.group,
  bindings: {
    'model.label': {
      type: 'text',
      hook: 'group-label'
    },
    'model.count': {
      type: 'text',
      hook: 'group-count'
    }
  },
  events: {
    'click [data-hook~=categorial-group-remove]': function () {
      this.collection.remove(this.model);

      var partition = this.collection.parent;
      var partitions = partition.collection;
      partitions.trigger('change', partition, {});
    }
  }
});
