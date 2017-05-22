
var app = require('ampersand-app');
var Router = require('./router');
var MainView = require('./pages/main');
var Me = require('../framework/me');
var domReady = require('domready');
var widgetFactory = require('./widgets/widget-factory');
var viewFactory = require('./widgets/view-factory');

var DialogPolyfill = require('dialog-polyfill');
var Swiper = require('swiper');

// NOTE: material-design-light does not work properly with require()
// workaround via browserify-shim (configured in package.json)
require('mdl');

// attach our app to `window` so we can
// easily access it from the console.
window.app = app;

// Extends our main app singleton
app.extend({
  editMode: true,
  me: new Me(),
  widgetFactory: widgetFactory,
  viewFactory: viewFactory,
  router: new Router(),

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
  message: function (options) {
    var snackbarContainer = document.getElementById('snack-bar');
    var snackData = {message: options.text};
    snackbarContainer.MaterialSnackbar.showSnackbar(snackData);

    if (options.type === 'error') {
      console.warn(options.text, options.error);
    } else {
      console.log(options.text);
    }
  },
  showDialog: function (options) {
    // open modal dialog
    var dialogContainer = document.getElementById('helpDialog');
    var closeButton = document.getElementById('dialogCloseButton');

    DialogPolyfill.registerDialog(dialogContainer);
    dialogContainer.showModal();

    closeButton.addEventListener('click', function () {
      dialogContainer.close();
      if (app.me.helpSlides) {
        // TODO: check if really destroyed
        app.me.helpSlides.destroy();
      }
    });

    // add carousel with help images
    var elem = document.getElementById('helpZone');

    app.me.helpSlides = new Swiper(elem, {
      nextButton: '.swiper-button-next',
      prevButton: '.swiper-button-prev',
      pagination: '.swiper-pagination',
      paginationType: 'progress'
    });
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
