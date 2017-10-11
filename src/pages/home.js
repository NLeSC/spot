var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');

var particlesJS = require('particlesjs');

module.exports = PageView.extend({
  initialize: function () {
    this.pageName = 'home';
    app.startWelcome();
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
    const $ = window.$;
    $.getJSON('../demo.json', function (data) {
      app.loadSessionBlob(data);
    });
  },
  demoSessionOnline: function () {
    app.downloadRemoteSession('https://raw.githubusercontent.com/NLeSC/spot/master/dist/demo.json');
  }

});
