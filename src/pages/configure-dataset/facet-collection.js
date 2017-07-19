var View = require('ampersand-view');
var templates = require('../../templates');
var app = require('ampersand-app');

module.exports = View.extend({
  template: templates.configureDataset.facet,
  initialize: function () {
    this.isLockedDown = app.me.isLockedDown;
  },
  render: function () {
    this.renderWithTemplate(this);
    window.componentHandler.upgradeDom(this.el);
    return this;
  },
  session: {
    'isLockedDown': 'boolean'
  },
  bindings: {
    'isLockedDown': {
      type: 'toggle',
      hook: 'actions',
      invert: 'yes'
    },
    'model.name': '[data-hook~=name]',
    'model.description': '[data-hook~=description]',
    'model.show': {
      type: 'toggle',
      hook: 'fullitem'
    },
    // turn on/off the facet
    'model.isActive': [
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
    'model.isDatetime': {
      type: 'booleanClass',
      hook: 'typeIcon',
      name: 'facetDatetimeIcon'
    },
    'model.isDuration': {
      type: 'booleanClass',
      hook: 'typeIcon',
      name: 'facetDurationIcon'
    },
    'model.isText': {
      type: 'booleanClass',
      hook: 'typeIcon',
      name: 'facetTextIcon'
    }
  },
  events: {
    'click .togglePower': 'togglePower',
    'click [data-hook~=configureFacet]': 'configureFacet',
    'click [data-hook~=removeFacet]': 'removeFacet',
    'click [data-hook~=duplicateFacet]': 'duplicateFacet'
  },
  togglePower: function (ev) {
    this.model.isActive = !this.model.isActive;

    if (this.model.isCategorial) {
      this.model.setCategories();
    } else if (this.model.isContinuous || this.model.isDatetime || this.model.isDuration) {
      this.model.setMinMax();
    }
  },
  configureFacet: function (ev) {
    app.navigate('facet/' + this.model.id);
  },
  removeFacet: function (ev) {
    this.collection.remove(this.model);
  },
  duplicateFacet: function (ev) {
    // make a copy with new name and id
    var duplicateFacet = this.model.toJSON();
    duplicateFacet.name += ' copy';
    delete duplicateFacet.id;

    this.collection.add(duplicateFacet);
  }
});
