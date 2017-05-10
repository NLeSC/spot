var PageView = require('./base');
var templates = require('../templates');

var particlesJS = require('particlesjs');

module.exports = PageView.extend({
  template: templates.home,
  autoRender: true,
  initialize: function () {
    this.pageName = 'home';

    particlesJS.init({
       selector: '.spotparticles'
     });

  },
  pageTitle: 'Home',
  events: {

  },
  render: function () {
    this.renderWithTemplate(this);
  }
});
