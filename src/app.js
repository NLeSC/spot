var Spot = require('spot-framework');
var app = require('ampersand-app');
var Router = require('./router');
var MainView = require('./pages/main');
var domReady = require('domready');
var widgetFactory = require('./widgets/widget-factory');
var viewFactory = require('./widgets/view-factory');

var Help = require('intro.js');
var templates = require('./templates');

// NOTE: material-design-light does not work properly with require()
// workaround via browserify-shim (configured in package.json)
require('mdl');

// attach our app to `window` so we can
// easily access it from the console.
window.app = app;

// Extends our main app singleton
app.extend({
  fullscreenMode: false,
  demoSession: false,
//  helper: Help.introJs(),
  me: new Spot(),
  widgetFactory: widgetFactory,
  viewFactory: viewFactory,
  router: new Router(),

  // CSV parsing options
  CSVSeparator: ',',
  CSVHeaders: true,
  CSVQuote: '"',
  CSVComment: '#',

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
    this.router.history.start({
      root: 'spot',
      pushState: true
    });
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

    // BUGFIX: during app initialization, the snackbar is not always ready yet
    if (!snackbarContainer.MaterialSnackbar) {
      return;
    }

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
  },

  downloadRemoteSession: function (sessionUrl) {
    console.log('app.js: Getting the remote session.');
    var request = new window.XMLHttpRequest();

    request.addEventListener('progress', updateProgress);
    request.addEventListener('load', transferComplete);
    request.addEventListener('error', transferFailed);
    request.addEventListener('abort', transferCanceled);

    request.open('GET', sessionUrl, true);
    request.responseType = 'json';

    function updateProgress (evt) {
      if (evt.lengthComputable) {
        var percentComplete = evt.loaded / evt.total;
        console.log('progress:', percentComplete);
        app.message({
          text: 'Progress: ' + percentComplete,
          type: 'ok'
        });
      }
    }

    function transferComplete (evt) {
      console.log('The transfer is complete.');
      app.message({
        text: 'Remote session was downloaded succesfully.',
        type: 'ok'
      });
      app.loadSessionBlob(request.response);
    }

    function transferFailed (evt) {
      console.log('An error occurred while transferring the file.');
      app.message({
        text: 'Remote session download problem.',
        type: 'error'
      });
    }

    function transferCanceled (evt) {
      console.log('The transfer has been canceled by the user.');
    }

    request.send();
  },
  loadSessionBlob: function (data) {
    app.me = new Spot(data);

    if (data.sessionType === 'server') {
      app.me.connectToServer(data.address);
    } else if (data.sessionType === 'client') {
      // add data from the session file to the dataset
      data.datasets.forEach(function (d, i) {
        app.me.datasets.models[i].crossfilter.add(d.data);
        app.me.datasets.models[i].isActive = false; // we'll turn it on later
      });
      // merge all the data into the app.me.dataview
      // by toggling the active datasets back on
      data.datasets.forEach(function (d, i) {
        if (d.isActive) {
          app.me.toggleDataset(app.me.datasets.models[i]);
        }
      });
    }
    // and automatically go to the analyze page
    app.navigate('/analyze');
  },
  startHelp: function () {
    console.log('app.js: startHelp()');
    // console.log('app.js: startHelp()', app.helper);
    // app.helper.setOptions({
    //   'showStepNumbers': false,
    //   'showBullets': false,
    //   'showProgress': false,
    //   'hintButtonLabel': 'Close',
    //   steps: [
    //     {
    //       intro: templates.help.welcome()
    //     }
    //   ]
    // });
    //
    // // console.log('app.js: startHelp()', app.helper);
    // app.helper.start();

    var helper = Help.introJs();
    helper.setOptions({
      'showStepNumbers': false,
      'showBullets': true,
      'showProgress': true,
      'doneLabel': 'Close'
    });

    helper.onafterchange(function (targetElement) {
      // fix for semistandard
      var $;
//      console.log(targetElement.id);
      $('.introjs-helperLayer').css('background', 'black');
      $('.introjs-helperLayer').css('opacity', '0.3');
        // switch (targetElement.id){
        //     case "welcome-info":
        //         $('.introjs-tooltip').css({top:'80px',left:'200px'});
        // }
    });

    helper.start();
  },
  startWelcome: function () {
    var welcome = Help.introJs();

    welcome.setOptions({
      'showStepNumbers': false,
      'showBullets': false,
      'showProgress': false,
      'doneLabel': 'Close',
      steps: [
        {
          intro: templates.help.welcome()
        }
      ]
    });

    // $(".introjs-tooltip").css("max-width", "300px");
    // welcome.onchange(function(evt) {
    //   var item = evt.item;
    //   var itemID = item.getAttribute(data-step);
    //     switch (itemID)
    //     {
    //         case "1":
    //             //Center the tooltip
    //             $(".introjs-tooltip").css("margin-left", "300px");
    //         break;
    //
    //         case "2":
    //             //Remove margin-left
    //             $(".introjs-tooltip").css("margin-left", "0");
    //         break;
    //
    //     }
    // });

    // welcome.oncomplete(function() {
    //     ;
    // });
    welcome.onexit(function () {

    });
    welcome.onchange(function (targetElement) {
         // add change bits here
    });
    welcome.onafterchange(function (targetElement) {
      // fix for semistandard
      var $;
      // $('.introjs-tooltip').css({top:'0px',left:'0px'});
      // $(".introjs-helperLayer").css("text-align", "center");
      // $(".introjs-helperLayer").css("min-width", "500px");
      $('.introjs-tooltip').css('min-width', '500px');
        // switch (targetElement.id){
        //     case "welcome-info":
        //         $('.introjs-tooltip').css({top:'80px',left:'200px'});
        // }
    });
    welcome.onbeforechange(function (targetElement) {
         // add change bits here
    });

// add a flag when we're done
    welcome.oncomplete(function () {
      window.localStorage.setItem('spotWelcome', 'done');
    });

    // add a flag when we exit
    welcome.onexit(function () {
      window.localStorage.setItem('spotWelcome', 'done');
    });

    var spotWelcome = window.localStorage.getItem('spotWelcome') === 'done';
    if (spotWelcome) {
      // console.log('No need to show welcome dialog again.');

    } else {
      console.log('Starting the welcome dialog.');
      welcome.start();
    }

//    welcome.start();
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
