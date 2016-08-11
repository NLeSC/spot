var View = require('ampersand-view');
var templates = require('../templates');

module.exports = View.extend({
  template: templates.includes.facetDefine,
  bindings: {
    'model.name': {
      type: 'value',
      hook: 'define-name-input'
    },
    'model.units': {
      type: 'value',
      hook: 'define-units-input'
    },
    'model.description': {
      type: 'value',
      hook: 'define-description-input'
    },

    'model.isContinuous': {
      type: 'booleanAttribute',
      hook: 'define-type-continuous',
      name: 'checked'
    },
    'model.isCategorial': {
      type: 'booleanAttribute',
      hook: 'define-type-categorial',
      name: 'checked'
    },
    'model.isTimeOrDuration': {
      type: 'booleanAttribute',
      hook: 'define-type-timeorduration',
      name: 'checked'
    },

    'model.accessor': {
      type: 'value',
      hook: 'define-accessor-input'
    },
    'model.misvalAsText': {
      type: 'value',
      hook: 'define-missing-input'
    }
  },
  events: {
    'change [data-hook~=define-name-input]': function () {
      this.model.name = this.queryByHook('define-name-input').value;
    },
    'change [data-hook~=define-units-input]': function () {
      this.model.units = this.queryByHook('define-units-input').value;
    },
    'change [data-hook~=define-description-input]': function () {
      this.model.description = this.queryByHook('define-description-input').value;
    },

    'click [data-hook~=define-type-continuous]': function () {
      this.model.type = 'continuous';
      this.model.transform = 'none';
    },
    'click [data-hook~=define-type-categorial]': function () {
      this.model.type = 'categorial';
      this.model.transform = 'none';
    },
    'click [data-hook~=define-type-timeorduration]': function () {
      this.model.type = 'timeorduration';
      this.model.transform = 'none';
    },

    'change [data-hook~=define-accessor-input]': function () {
      this.model.accessor = this.queryByHook('define-accessor-input').value;
    },
    'change [data-hook~=define-missing-input]': function () {
      this.model.misvalAsText = this.queryByHook('define-missing-input').value;
    }
  }
});
