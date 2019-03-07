var View = require('ampersand-view');
var templates = require('../../templates');
var app = require('ampersand-app');

module.exports = View.extend({
  template: templates.datasets.session,
  derived: {
    // facetsURL: {
    //   deps: ['model.id'],
    //   fn: function () {
    //     return this.model.id;
    //   }
    // }
  },
  props: {
    bussy: ['boolean', true, false]
  },
  bindings: {
    'bussy': [
      {
        hook: 'cbtoggle',
        type: 'toggle',
        invert: true
      },
      {
        hook: 'cbspinner',
        type: 'toggle',
        invert: false
      }
    ],
    // 'model.show': {
    //   hook: 'session',
    //   type: 'toggle'
    // },
    'model.date': {
      hook: 'date',
      type: 'text'
    },    
    'model.name': {
      hook: 'name',
      type: 'text'
    },
    // material design hooks
    'model.isActive': [
      {
        hook: 'cb',
        type: 'booleanAttribute',
        name: 'checked'
      },
      {
        type: 'toggle',
        hook: 'settings',
        invert: true
      }
    ],
    'model.id': [
      { hook: 'cb', type: 'attribute', name: 'id' },
      { hook: 'cblabel', type: 'attribute', name: 'for' }
    ]
  },
  events: {
    'change': 'toggleActive',
    // 'click [data-hook~=settings]': function () { app.navigate('/dataset/' + this.model.id); },
    'click [data-hook~=delete]': 'deleteSession'
  },
  toggleActive: function () {
    var that = this;

    that.bussy = !that.busy;
    that.model.isActive = !that.model.isActive;

  //   // if (that.model.facets.length === 0) {
  //   //   // Automatically scan the dataset if there are no facets
  //   //   that.model.scan();
  //   //   that.model.once('syncFacets', function () {
  //   //     app.me.toggleDataset(that.model);
  //   //     that.bussy = !that.bussy;
  //   //   });
  //   // } else {
  //   //   // BUGFIX: we cant show/hide the spinner from within the event loop; so
  //   //   //  * activate the spinner,
  //   //   //  * exit the event loop (ie. redraw the page),
  //   //   //  * and toggle the dataset via the timeout
  //   //   window.setTimeout(function () {
  //   //     app.me.toggleDataset(that.model);
  //   //     that.bussy = !that.bussy;
  //   //   }, 500);
  //   // }

    that.bussy = !that.bussy;
  },
  deleteSession: function () {
    console.log('Deleting the session')
  //   // if (this.model.isActive) {
  //   //   this.bussy = true;
  //   //   app.me.toggleDataset(this.model);
  //   //   this.bussy = false;
  //   // }
    console.log(this.model);
    app.removeSessionFromLocalStorage(this.model.id);
  },
  render: function () {
    this.renderWithTemplate(this);
  }
});
