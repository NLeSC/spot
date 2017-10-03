var Spot = require('spot-framework');
var View = require('ampersand-view');
var templates = require('../../templates');
var misval = Spot.util.misval;

function addRawValue (string, raw) {
  if (typeof string !== 'string' || string.length === 0) {
    string = '';
  } else {
    string = string + ', ';
  }

  if (typeof raw === 'string') {
    string = string + '"' + raw + '"';
  } else if (typeof raw === 'number') {
    string = string + raw;
  } else {
    console.warn('Cannot add raw value', raw, 'of type', typeof raw);
  }
  return string;
}

module.exports = View.extend({
  template: templates.configureFacet.facetDefine,
  derived: {
    showMinMax: {
      deps: ['model.type'],
      fn: function () {
        return this.model.type === 'datetime' || this.model.type === 'duration' || this.model.type === 'continuous';
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
    'model.isDatetime': {
      type: 'booleanAttribute',
      hook: 'define-type-datetime',
      name: 'checked'
    },
    'model.isDuration': {
      type: 'booleanAttribute',
      hook: 'define-type-duration',
      name: 'checked'
    },
    'model.isText': {
      type: 'booleanAttribute',
      hook: 'define-type-text',
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
    },
    'click [data-hook~=define-type-categorial]': function () {
      this.model.type = 'categorial';
    },
    'click [data-hook~=define-type-datetime]': function () {
      this.model.type = 'datetime';
    },
    'click [data-hook~=define-type-duration]': function () {
      this.model.type = 'duration';
    },
    'click [data-hook~=define-type-text]': function () {
      this.model.type = 'text';
    },
    'click [data-hook~=button-minval-missing]': function () {
      if (this.model.minval === misval) {
        return;
      }
      if (this.model.hasOwnProperty('rawMinval')) {
        this.model.misvalAsText = addRawValue(this.model.misvalAsText, this.model.rawMinval);
      } else {
        this.model.misvalAsText += ', ' + this.model.minvalAsText;
      }
      this.model.minvalAsText = 'scanning';
      this.model.setMinMax();
      this.queryByHook('define-maximum-input').dispatchEvent(new window.Event('input'));
      this.queryByHook('define-minimum-input').dispatchEvent(new window.Event('input'));
      this.queryByHook('define-missing-input').dispatchEvent(new window.Event('input'));
    },
    'click [data-hook~=button-maxval-missing]': function () {
      if (this.model.maxval === misval) {
        return;
      }
      if (this.model.hasOwnProperty('rawMaxval')) {
        this.model.misvalAsText = addRawValue(this.model.misvalAsText, this.model.rawMaxval);
      } else {
        this.model.misvalAsText += ', ' + this.model.maxvalAsText;
      }
      this.model.maxvalAsText = 'scanning';
      this.model.setMinMax();
      this.queryByHook('define-maximum-input').dispatchEvent(new window.Event('input'));
      this.queryByHook('define-minimum-input').dispatchEvent(new window.Event('input'));
      this.queryByHook('define-missing-input').dispatchEvent(new window.Event('input'));
    },
    'click [data-hook~=define-rescan-button]': function () {
      if (this.model.isContinuous || this.model.isDatetime || this.model.isDuration) {
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
