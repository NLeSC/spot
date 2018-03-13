var View = require('ampersand-view');
var templates = require('../../templates');

module.exports = View.extend({
  template: templates.configurePartition.group,
  bindings: {
    'model.label': {
      type: 'text',
      hook: 'group-label'
    },
    'model.count': {
      type: 'text',
      hook: 'group-count'
    }
  }
});
