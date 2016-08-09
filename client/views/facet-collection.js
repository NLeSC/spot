var View = require('ampersand-view');
var templates = require('../templates');
var app = require('ampersand-app');
var ConfigureFacetPage = require('../pages/configure-facet');

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
    'model.active': [
      {
        type: 'booleanAttribute',
        hook: 'power',
        name: 'checked'
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
    this.model.active = !this.model.active;

    // autoconfigure when no groups are defined
    if (this.model.active && this.model.groups.length === 0) {
      if (this.model.displayContinuous) {
        this.model.setMinMax(true);
      } else if (this.model.displayDatetime) {
        this.model.setMinMax(true);
      } else if (this.model.displayCategorial) {
        this.model.setCategories(true);
      }
    }
  },
  editFacet: function () {
    app.trigger('page', new ConfigureFacetPage({model: this.model}));
  }
});
