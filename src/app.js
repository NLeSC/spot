var Spot = require('spot-framework');
var app = require('ampersand-app');
var Router = require('./router');
var MainView = require('./pages/main');
var domReady = require('domready');
var widgetFactory = require('./widgets/widget-factory');
var viewFactory = require('./widgets/view-factory');

// NOTE: material-design-light does not work properly with require()
// workaround via browserify-shim (configured in package.json)
require('mdl');

// attach our app to `window` so we can
// easily access it from the console.
window.app = app;

// Extends our main app singleton
app.extend({
  editMode: true,
  me: new Spot(),
  widgetFactory: widgetFactory,
  viewFactory: viewFactory,
  router: new Router(),

  // CSV parsing options
  CSVSeparator: ',',
  CSVHeaders: true,
  CSVQuote: '"',

  // This is where it all starts
  init: function () {
    // Create and attach our main view
    this.mainView = new MainView({
      model: this.me,
      el: document.body
    });

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
  },
  progress: function (percentage) {
    var progressBar = document.getElementById('progress-bar');
    progressBar.MaterialProgress.setProgress(percentage);

    progressBar.style.display = 'inherit';
  },
  message: function (options) {
    var snackbarContainer = document.getElementById('snack-bar');
    var snackData = { message: options.text };

    var progressBar = document.getElementById('progress-bar');
    progressBar.style.display = 'none';

    if (options.type === 'error') {
      console.warn(options.text, options.error);
      snackData.timeout = 10000; // show error for 10 seconds
    } else {
      console.log(options.text);
      snackData.timeout = 2750;
    }
    snackbarContainer.MaterialSnackbar.showSnackbar(snackData);
  }
});

// run it on domReady
domReady(function () {
  app.init();

  // un-comment to start locked down and connected to database
  // app.me.isLockedDown = true;
  // app.me.connectToServer(window.location.hostname);
  // app.me.socket.emit('getDatasets');
});
