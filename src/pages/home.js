var PageView = require('./base');
var templates = require('../templates');

// For the help
var Tour = require('intro.js');

module.exports = PageView.extend({
  initialize: function () {
    this.pageName = 'home';

    var introWelcome = Tour.introJs();
    introWelcome.setOptions({
      steps: [{
        intro: 'Welcome to SPOT!'
      }, {
        intro: "You <b>don't need</b> to define element to focus, this is a floating tooltip."
      }]
    });

    // add a flag when we're done
    introWelcome.oncomplete(function () {
      window.localStorage.setItem('doneWelcome', 'great!');
    });

    // add a flag when we exit
    introWelcome.onexit(function () {
      window.localStorage.setItem('doneWelcome', 'great!');
    });

    var doneWelcome = window.localStorage.getItem('doneWelcome') === 'great!';
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

  }

});
