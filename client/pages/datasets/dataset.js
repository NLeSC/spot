var View = require('ampersand-view');
var templates = require('../../templates');
var app = require('ampersand-app');

module.exports = View.extend({
  template: templates.datasets.dataset,
  derived: {
    facetsURL: {
      deps: ['model.id'],
      fn: function () {
        return '/dataset/' + this.model.id;
      }
    }
  },
  props: {
    bussy: ['boolean', true, false]
  },
  bindings: {
    'bussy': [
      {
        hook: 'cblabel',
        type: 'toggle',
        invert: true
      },
      {
        hook: 'cbspinner',
        type: 'toggle',
        invert: false
      }
    ],
    'model.show': {
      hook: 'dataset',
      type: 'toggle'
    },
    'model.name': {
      hook: 'name',
      type: 'text'
    },
    'model.description': {
      hook: 'description',
      type: 'text'
    },
    'facetsURL': {
      hook: 'name',
      type: 'attribute',
      name: 'href'
    },
    'model.isActive': {
      hook: 'cb',
      type: 'booleanAttribute',
      name: 'checked'
    },
    // material design hooks
    'model.id': [
      { hook: 'cb', type: 'attribute', name: 'id' },
      { hook: 'cblabel', type: 'attribute', name: 'for' }
    ]
  },
  events: {
    'change': 'toggleActive'
  },
  toggleActive: function () {
    var that = this;

    // BUGFIX: we cant show/hide the spinner from within the event loop; so
    //  * activate the spinner,
    //  * exit the event loop (ie. redraw the page),
    //  * and toggle the dataset via the timeout
    that.bussy = !that.busy;
    window.setTimeout(function () {
      app.me.toggleDataset(that.model);
      that.bussy = !that.bussy;
    }, 500);
  },
  render: function () {
    this.renderWithTemplate(this);
  }
});
