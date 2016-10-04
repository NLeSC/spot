var View = require('ampersand-view');
var templates = require('../templates');
var app = require('ampersand-app');

module.exports = View.extend({
  template: templates.includes.facet,
  derived: {
    facetTTId: {
      deps: ['model.id'],
      fn: function () {
        return 'facetTT' + this.model.id;
      }
    },
    powerId: {
      deps: ['model.id'],
      fn: function () {
        return 'powerToggle' + this.model.id;
      }
    }
  },
  render: function () {
    this.renderWithTemplate(this);
    window.componentHandler.upgradeDom(this.el);
    return this;
  },
  bindings: {
    'model.name': '[data-hook~=name]',
    'model.description': '[data-hook~=description]',
    'model.show': {
      type: 'toggle',
      hook: 'fullitem'
    },
    // turn on/off the facet
    'model.isActive': [
      {
        type: 'booleanAttribute',
        hook: 'power',
        name: 'checked'
      },
      {
        type: 'booleanClass',
        hook: 'fullitem',
        yes: 'activeFacet',
        no: 'inactiveFacet'
      }
    ],
    'model.isCategorial': {
      type: 'booleanClass',
      hook: 'typeIcon',
      name: 'facetCategorialIcon'
    },
    'model.isContinuous': {
      type: 'booleanClass',
      hook: 'typeIcon',
      name: 'facetContinuousIcon'
    },
    'model.isTimeOrDuration': {
      type: 'booleanClass',
      hook: 'typeIcon',
      name: 'facetTimeIcon'
    },
    // hook up interactive mdl
    'powerId': [
      {
        type: 'attribute',
        hook: 'powerlabel',
        name: 'for'
      },
      {
        type: 'attribute',
        hook: 'power',
        name: 'id'
      }
    ],
    'facetTTId': [
      {
        type: 'attribute',
        hook: 'facetTT',
        name: 'for'
      },
      {
        type: 'attribute',
        hook: 'clickToEdit',
        name: 'id'
      }
    ]
  },
  events: {
    'change [data-hook~=power]': 'togglePower',
    'click [data-hook~=clickToEdit]': 'editFacet'
  },
  togglePower: function (ev) {
    ev.preventDefault();
    this.model.isActive = !this.model.isActive;

    if (this.model.isCategorial) {
      this.model.setCategories();
    } else if (this.model.isContinuous) {
      this.model.setMinMax();
    } else if (this.model.isTimeOrDuration) {
      this.model.setMinMax();
    }
  },
  editFacet: function () {
    app.navigate('facet/' + this.model.id);
  }
});
