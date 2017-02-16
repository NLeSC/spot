var app = require('ampersand-app');
var Router = require('./router');
var MainView = require('./pages/main');
var Me = require('../framework/me');
var domReady = require('domready');
var widgetFactory = require('./widgets/widget-factory');
var viewFactory = require('./widgets/view-factory');

var Flickity = require('flickity');
var DialogPolyfill = require('dialog-polyfill');

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
    var dialogContainer = document.getElementById('helpDialog');
    // var dialogContent = document.getElementById('dialog-content');
    var closeButton = document.getElementById('dialogCloseButton');

    // console.log(dialogContainer);

    // var dialogData = {message: options.text};
    // TODO: add content dynamically using options argument

    DialogPolyfill.registerDialog(dialogContainer);
    dialogContainer.showModal();

    closeButton.addEventListener('click', function () {
      dialogContainer.close();
    });

    app.carousel();

    if (options.error) {
      console.warn(options.text, options.error);
    } else {
      console.log(options.text);
    }
  },
  carousel: function (options) {
    var elem = document.getElementById('helpZone');
//    var butNext = document.getElementById('.button--next');
//    var anims = elem.querySelectorAll('video');
    var currentSlide = 0;
    var previousSlide = 0;

    // var carData = {message: options.text};
    // cardContainer.MaterialSnackbar.showSnackbar(snackData);
    // console.log('Calling app.carousel');
    // console.log(elem);

    // var img1 = document.getElementById('img1');
    // console.log(img1);

    var flkty = new Flickity(elem, {
      // options
      cellAlign: 'center',
      initialIndex: 0,
      pageDots: false,
      resize: true
    });

    var animFirst = document.getElementById('img0');
    // console.log('playing:" \n', animCurrent);
    animFirst.play();

    flkty.on('select', function (event, progress) {
      currentSlide = flkty.selectedIndex;
      // if (currentSlide > previousSlide){
      //   console.log('moving right');
      //   console.log('current slide:', currentSlide);
      //   console.log('previous slide:', previousSlide);
      // }
      // else {
      //   console.log('moving left');
      //   console.log('current slide:', currentSlide);
      //   console.log('previous slide:', previousSlide);
      // }

       // console.log(event);
       // console.log(progress);
      //  console.log( 'carousel at ' + currentSlide )
       // console.log( flkty.selectedIndex );
       // console.log( flkty.selectedElement );
      var animCurrent = document.getElementById('img' + currentSlide);
      var animPrevious = document.getElementById('img' + previousSlide);

      //  console.log('stopping:" \n', animPrevious);
      animPrevious.pause();
      //  console.log('playing:" \n', animCurrent);
      animCurrent.play();

      previousSlide = currentSlide;
    });

//
//     var videos = elem.querySelectorAll('video');
//
//     for ( var i=0, len = videos.length; i < len; i++ ) {
//       var video = videos[i];
//       // resume autoplay for WebKit
//       video.play();
// //      eventie.bind( video, 'loadeddata', onLoadeddata );
//       //video.on( 'loadeddata', onLoadeddata );
//      console.log('playing: \n', video);
//     }

    // TODO: enable/disable videos when clicked on slider button

    // if (options.verbose) {
    //   console.log(flkty);
    // }

    // if (options.error) {
    //   console.warn(options.text, options.error);
    // } else {
    //   console.log(options.text);
    // }
  }

});

// run it on domReady
domReady(function () {
  app.init();
});
