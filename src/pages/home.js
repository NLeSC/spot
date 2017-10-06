var PageView = require('./base');
var templates = require('../templates');
var Spot = require('spot-framework');
var app = require('ampersand-app');

// For the help
var Tour = require('intro.js');
var particlesJS = require('particlesjs');

module.exports = PageView.extend({
  initialize: function () {
    this.pageName = 'home';
    var introWelcome = Tour.introJs();
    introWelcome.setOptions({
      'showStepNumbers': false,
      'showBullets': false,
      'showProgress': false,
      steps: [
        {
          intro: '<center>Welcome to SPOT!</center><br>If you want to discover SPOT, you can start a demo session at the bottom of this page.<br>When you need help, please use <b>Help</b> button at the bottom of the left menu.<br> For online tutorial, please check <a href="https://nicorenaud.gitbooks.io/spot-first-step/content" target="_blank">this link</a>.'
        }
      ]
    });

    // add a flag when we're done
    introWelcome.oncomplete(function () {
      window.localStorage.setItem('doneWelcome', 'welcomed');
    });

    // add a flag when we exit
    introWelcome.onexit(function () {
      window.localStorage.setItem('doneWelcome', 'welcomed');
    });

    var doneWelcome = window.localStorage.getItem('doneWelcome') === 'welcomed';
    if (doneWelcome) {
      console.log('Did the tour already!');
    } else {
      console.log('Starting the tour.');
      introWelcome.start();
    }
  },
  pageTitle: 'Home',
  template: templates.home,
  events: {
    'change': 'toggleAnimation',
    'click [data-hook~=demo-session]': 'demoSessionLocal'
  },
  bindings: {
    'startanim': [
      {
        hook: 'animtoggle',
        type: 'toggle',
        invert: true
      }
    ],

    // material design hooks
    'model.isActive': [
      {
        hook: 'anim',
        type: 'booleanAttribute',
        name: 'checked'
      }
    ],
    'model.id': [
      { hook: 'anim', type: 'attribute', name: 'id' },
      { hook: 'animlabel', type: 'attribute', name: 'for' }
    ]
  },
  toggleAnimation: function () {
    var animButton = this.queryByHook('animtoggle');
    animButton.classList.toggle('is-checked');
    if (animButton.classList.contains('is-checked')) {
      particlesJS.options.maxParticles = 120;
    } else {
      particlesJS.options.maxParticles = 0;
    }
    console.log(particlesJS.options.maxParticles);
    particlesJS._refresh();
  },
  renderContent: function () {
    particlesJS.init({
      selector: '.particles',
      color: '#ffffff',
      connectParticles: true,
      minDistance: 120,
      speed: 0.5,
      sizeVariations: 5,
      maxParticles: 0
    });
  },
  demoSessionLocal: function () {
    // TODO: merge this function with demoSessionOnline and clean up
    const $ = window.$;
    $.getJSON('demo.json', function (data) {
      app.me = new Spot(data);

      if (data.sessionType === 'server') {
        app.me.connectToServer(data.address);
      } else if (data.sessionType === 'client') {
        // add data from the session file to the dataset
        data.datasets.forEach(function (d, i) {
          app.me.datasets.models[i].crossfilter.add(d.data);
          app.me.datasets.models[i].isActive = false; // we'll turn it on later
        });

        data.datasets.forEach(function (d, i) {
          if (d.isActive) {
            app.me.toggleDataset(app.me.datasets.models[i]);
          }
        });
      }

      app.message({
        text: 'Demo session was started succesfully',
        type: 'ok'
      });

      // and automatically go to the analyze page
      app.navigate('/analyze');
    });
  },
  demoSessionOnline: function () {
    console.log('Starting the demo session');
    app.message({
      text: 'Starting the demo session. Please wait.',
      type: 'ok'
    });

    // TODO: switch to node-fetch
    var getJSON = function (url, callback) {
      var xhr = new window.XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'json';
      xhr.onload = function () {
        var status = xhr.status;
        if (status === 200) {
          callback(null, xhr.response);
        } else {
          callback(status, xhr.response);
        }
      };
      xhr.send();
    };

    var sessionUrl = 'https://raw.githubusercontent.com/fdiblen/spot-data/3a5c29c2a796e14f7fe9ed7880d05bbb0703aa11/demo_session.json';

    getJSON(sessionUrl,
    function (err, data) {
      if (err !== null) {
        window.alert('Something went wrong: ' + err);
      } else {
        app.me = new Spot(data);

        if (data.sessionType === 'server') {
          app.me.connectToServer(data.address);
        } else if (data.sessionType === 'client') {
          // add data from the session file to the dataset
          data.datasets.forEach(function (d, i) {
            app.me.datasets.models[i].crossfilter.add(d.data);
            app.me.datasets.models[i].isActive = false; // we'll turn it on later
          });

          data.datasets.forEach(function (d, i) {
            if (d.isActive) {
              app.me.toggleDataset(app.me.datasets.models[i]);
            }
          });
        }

        app.message({
          text: 'Demo session was started succesfully',
          type: 'ok'
        });

        // and automatically go to the analyze page
        app.navigate('/analyze');
      }
    });
  }

});
