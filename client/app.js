
var app = require('ampersand-app');
var Router = require('./router');
var MainView = require('./pages/main');
var Me = require('../framework/me');
var domReady = require('domready');
var widgetFactory = require('./widgets/widget-factory');
var viewFactory = require('./widgets/view-factory');

var DialogPolyfill = require('dialog-polyfill');
var Flickity = require('flickity');

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

    if (options.error) {
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
    });

    // add carousel with help images
    var elem = document.getElementById('helpZone');
    var verbose = false;

    var flkty = new Flickity(elem, {
      // options, defaults listed

      accessibility: true,
      // enable keyboard navigation, pressing left & right keys

      adaptiveHeight: false,
      // set carousel height to the selected slide

      autoPlay: false,
      // advances to the next cell
      // if true, default is 3 seconds
      // or set time between advances in milliseconds
      // i.e. `autoPlay: 1000` will advance every 1 second

      cellAlign: 'center',
      // alignment of cells, 'center', 'left', or 'right'
      // or a decimal 0-1, 0 is beginning (left) of container, 1 is end (right)

      cellSelector: undefined,
      // specify selector for cell elements

      contain: false,
      // will contain cells to container
      // so no excess scroll at beginning or end
      // has no effect if wrapAround is enabled

      draggable: true,
      // enables dragging & flicking

      dragThreshold: 3,
      // number of pixels a user must scroll horizontally to start dragging
      // increase to allow more room for vertical scroll for touch devices

      freeScroll: false,
      // enables content to be freely scrolled and flicked
      // without aligning cells

      friction: 0.2,
      // smaller number = easier to flick farther

      groupCells: false,
      // group cells together in slides

      initialIndex: 0,
      // zero-based index of the initial selected cell

      lazyLoad: true,
      // enable lazy-loading images
      // set img data-flickity-lazyload="src.jpg"
      // set to number to load images adjacent cells

      percentPosition: true,
      // sets positioning in percent values, rather than pixels
      // Enable if items have percent widths
      // Disable if items have pixel widths, like images

      prevNextButtons: true,
      // creates and enables buttons to click to previous & next cells

      pageDots: true,
      // create and enable page dots

      resize: true,
      // listens to window resize events to adjust size & positions

      rightToLeft: false,
      // enables right-to-left layout

      setGallerySize: true,
      // sets the height of gallery
      // disable if gallery already has height set with CSS

      watchCSS: false,
      // watches the content of :after of the element
      // activates if #element:after { content: 'flickity' }

      wrapAround: false
      // at end of cells, wraps-around to first for infinite scrolling

    });

    if (verbose) {
      console.log(flkty);
    }

    console.log(this.currentPage.pageName);
  }

});

// run it on domReady
domReady(function () {
  app.init();
});
