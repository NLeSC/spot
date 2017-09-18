var PageView = require('./base');
var templates = require('../templates');

// For the help
var Tour = require('intro.js');

module.exports = PageView.extend({
  initialize: function () {
    this.pageName = 'home';

    var intro = Tour.introJs();
    intro.setOptions({
                steps: [
                  {
                    intro: "Welcome to SPOT!"
                  },
                  {
                    intro: "You <b>don't need</b> to define element to focus, this is a floating tooltip."
                  }
                ]
              });
    intro.start();
  },
  pageTitle: 'Home',
  template: templates.home,
  events: {

  }

});
