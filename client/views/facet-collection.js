var View = require('ampersand-view');
var templates = require('../templates');
var app = require('ampersand-app');

module.exports = View.extend({
  template: templates.includes.facet,
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
    }
  },
  events: {
    'click [data-hook~=fullitem]': 'togglePower',
    'click [data-hook~=configureFacet]': 'configureFacet',
    'click [data-hook~=removeFacet]': 'removeFacet',
    'click [data-hook~=duplicateFacet]': 'duplicateFacet'
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
  configureFacet: function (ev) {
    ev.preventDefault();
    app.navigate('facet/' + this.model.id);
  },
  removeFacet: function (ev) {
    ev.preventDefault();
    app.me.dataset.facets.remove(this.model);
  },
  duplicateFacet: function (ev) {
    ev.preventDefault();

    // make a copy with new name and id
    var duplicateFacet = this.model.toJSON();
    duplicateFacet.name += ' copy';
    delete duplicateFacet.id;

    app.me.dataset.facets.add(duplicateFacet);
  }
});
