var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
  template: templates.includes.group,
  derived: {
    showMinMax: {
      deps: ['model.collection.parent.displayContinuous', 'model.collection.parent.displayDatetime'],
      fn: function () {
        var facet = this.model.collection.parent;

        if (facet.displayContinuous || facet.displayDatetime) {
          return true;
        }
        return false;
      }
    },
    showRemove: {
      deps: ['model.collection.parent.displayCategorial'],
      fn: function () {
        var facet = this.model.collection.parent;
        return facet.displayCategorial;
      }
    }
  },
  bindings: {
    'showMinMax': [
      {
        type: 'toggle',
        hook: 'continuous-group-min'
      },
      {
        type: 'toggle',
        hook: 'continuous-group-max'
      }
    ],
    'showRemove': [
      {
        type: 'toggle',
        hook: 'categorial-group-remove'
      }
    ],

    'model.min': {
      type: 'text',
      hook: 'continuous-group-min'
    },
    'model.max': {
      type: 'text',
      hook: 'continuous-group-max'
    },
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
    }
  }
});
