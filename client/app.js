var app = require('ampersand-app');
var Router = require('./router');
var MainView = require('./views/main');
var Me = require('./models/me');
var domReady = require('domready');
var widgetFactory = require('./widget-factory');
var viewFactory = require('./view-factory');

// NOTE: MDL does not work properly with require()
// but importing it here ensures it is available in the global scope
var mdl = require('mdl');

// attach our app to `window` so we can
// easily access it from the console.
window.app = app;

// Extends our main app singleton
app.extend({
  me: new Me(),
  widgetFactory: widgetFactory,
  viewFactory: viewFactory,
  router: new Router(),

  // socketio for communicating with spot-server
  socket: false,
  isConnected: false,

  // This is where it all starts
  init: function () {
    // Create and attach our main view
    this.mainView = new MainView({
      model: this.me,
      el: document.body
    });

    // Do something with mdl to prevent semistandard complaining about unused vars
    console.log('Using Material Design Lite', mdl);

    // this kicks off our backbutton tracking (browser history)
    // and will cause the first matching handler in the router
    // to fire.
    this.router.history.start({ pushState: true });
  },
  // This is a helper for navigating around the app.
  // this gets called by a global click handler that handles
  // all the <a> tags in the app.
  // it expects a url pathname for example: "/costello/settings"
  navigate: function (page) {
    var url = (page.charAt(0) === '/') ? page.slice(1) : page;
    this.router.history.navigate(url, {
      trigger: true
    });
  }
});

// run it on domReady
domReady(function () {
  app.init();
});
