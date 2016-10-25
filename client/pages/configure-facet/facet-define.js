var View = require('ampersand-view');
var templates = require('../templates');

function addRawValue (string, raw) {
  if (typeof raw === 'string') {
    return string + ', "' + raw + '"';
  } else if (typeof raw === 'number') {
    return string + ', ' + raw;
  } else {
    console.log('Cannot add raw value', raw, 'of type', typeof raw);
  }
}

module.exports = View.extend({
  template: templates.includes.facetDefine,
  derived: {
    showMinMax: {
      deps: ['model.type'],
      fn: function () {
        return this.model.type === 'timeorduration' || this.model.type === 'continuous';
      }
    }
  },
  bindings: {
    'showMinMax': [
      {
        type: 'toggle',
        hook: 'define-minimum-div'
      },
      {
        type: 'toggle',
        hook: 'define-maximum-div'
      }
    ],
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
    },
    'model.minvalAsText': {
      type: 'value',
      hook: 'define-minimum-input'
    },
    'model.maxvalAsText': {
      type: 'value',
      hook: 'define-maximum-input'
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
    'click [data-hook~=button-minval-missing]': function () {
      if (this.model.hasOwnProperty('rawMinval')) {
        this.model.misvalAsText = addRawValue(this.model.misvalAsText, this.model.rawMinval);
      } else {
        this.model.misvalAsText += ', ' + parseFloat(this.model.minvalAsText);
      }
      this.model.minvalAsText = 'scanning';
      this.model.setMinMax();
      this.queryByHook('define-minimum-input').dispatchEvent(new window.Event('input'));
    },
    'click [data-hook~=button-maxval-missing]': function () {
      if (this.model.hasOwnProperty('rawMaxval')) {
        this.model.misvalAsText = addRawValue(this.model.misvalAsText, this.model.rawMaxval);
      } else {
        this.model.misvalAsText += ', ' + parseFloat(this.model.maxvalAsText);
      }
      this.model.maxvalAsText = 'scanning';
      this.model.setMinMax();
      this.queryByHook('define-maximum-input').dispatchEvent(new window.Event('input'));
    },
    'click [data-hook~=define-rescan-button]': function () {
      if (this.model.isContinuous || this.model.isTimeOrDuration) {
        this.model.minvalAsText = 'scanning';
        this.model.maxvalAsText = 'scanning';
        this.model.setMinMax();
        this.queryByHook('define-minimum-input').dispatchEvent(new window.Event('input'));
        this.queryByHook('define-maximum-input').dispatchEvent(new window.Event('input'));
      } else if (this.model.isCategorial) {
        this.model.setCategories();
      }
    },

    'change [data-hook~=define-accessor-input]': function () {
      this.model.accessor = this.queryByHook('define-accessor-input').value;
    },
    'change [data-hook~=define-missing-input]': function () {
      this.model.misvalAsText = this.queryByHook('define-missing-input').value;
    },
    'change [data-hook~=define-minimum-input]': function () {
      this.model.minvalAsText = this.queryByHook('define-minimum-input').value;
    },
    'change [data-hook~=define-maximum-input]': function () {
      this.model.maxvalAsText = this.queryByHook('define-maximum-input').value;
    }
  }
});
