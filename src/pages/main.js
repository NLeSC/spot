// This app view is responsible for rendering all content that goes into
// <html>. It's initted right away and renders itself on DOM ready.
var app = require('ampersand-app');
// var setFavicon = require('favicon-setter');
var View = require('ampersand-view');
var ViewSwitcher = require('ampersand-view-switcher');
var localLinks = require('local-links');
var domify = require('domify');
var templates = require('../templates');

// For the help
var Tour = require('intro.js');
var ColorPicker = require('simple-color-picker');

function checkConnection (model) {
  if (model.sessionType === 'server' && !model.isConnected) {
    app.message({
      text: 'Trying to connect to database ' + window.location.hostname,
      type: 'error'
    });
  }

  // retry
  window.setTimeout(function () {
    checkConnection(model);
  }, 4000);
}

module.exports = View.extend({
  template: templates.main,
  autoRender: true,
  initialize: function () {
    this.pageName = 'main';
    // this marks the correct nav item selected
    this.listenTo(app, 'page', this.handleNewPage);

    // periodically check database connection
    checkConnection(this.model);

    this.model.on('change:isConnected', function () {
      if (this.model.isConnected) {
        app.message({
          text: 'Connected to  ' + window.location.hostname,
          type: 'ok'
        });
      }
    }, this);
  },
  events: {
    'click a[href]': 'handleLinkClick',
    'click [data-hook~=tour-button]': 'startTour',
    'click [data-hook~=menu-button]': 'handleMenu',

    'click [data-hook~=menu-color-button]': 'showColorSettings',
    'click [data-hook~=color-settings-close]': 'closeColorSettings'
  },
  setColorPicker: function () {
    var picker = this.queryByHook('color-palette');
    var colorPicker = new ColorPicker({
      color: '#223446',
      background: '#454545',
      el: picker,
      width: 200,
      height: 200
    });

    return colorPicker;
  },
  startTour: function () {
    var intro = Tour.introJs();
    this.expandMenu();
    intro.start();
  },
  handleMenu: function () {
    var drawer = this.queryByHook('main-drawer');
    drawer.classList.toggle('is-expanded');
  },
  showColorSettings: function () {
    var dialog = this.queryByHook('color-settings');
    dialog.showModal();

    if (typeof this.colorpicker === 'undefined') {
      this.colorpicker = this.setColorPicker();
    }

    var picker = this.queryByHook('color-palette');
    var drawer = this.queryByHook('main-drawer');
    var navMenu = this.queryByHook('nav-menu');
    var menuSpacer = this.queryByHook('menu-spacer');
    var colorDialog = this.queryByHook('color-settings');

    this.colorpicker.onChange(function (hexStringColor) {
      picker.style.background = hexStringColor;
      drawer.style.background = hexStringColor;
      menuSpacer.style.background = hexStringColor;
      navMenu.style.background = hexStringColor;
      colorDialog.style.background = hexStringColor;
    });
  },
  closeColorSettings: function () {
    var dialog = this.queryByHook('color-settings');
    dialog.close();
  },
  changeMenuColor: function (color) {
    var drawer = this.queryByHook('main-drawer');
    var navMenu = this.queryByHook('nav-menu');
    var menuSpacer = this.queryByHook('menu-spacer');
    var colorDialog = this.queryByHook('color-settings');
    var pageContainer = this.queryByHook('test');
    drawer.style.background = color;
    menuSpacer.style.background = color;
    navMenu.style.background = color;
    colorDialog.style.background = color;
    pageContainer.style.background = color;
  },
  expandMenu: function () {
    var drawer = this.queryByHook('main-drawer');
    // window.alert(drawer.classList.contains("is-expanded"));
    drawer.classList.add('is-expanded');
  },
  render: function () {
    // some additional stuff we want to add to the document head
    document.head.appendChild(domify(templates.head()));
    document.title = 'Spot';

    // main renderer
    this.renderWithTemplate(this);

    // init and configure our page switcher
    this.pageSwitcher = new ViewSwitcher(this.queryByHook('page-container'), {
      show: function (newView, oldView) {
        document.scrollTop = 0;

        // store an additional reference, just because
        app.currentPage = newView;
      }
    });

    // setting a favicon for fun (note, it's dynamic)
    // setFavicon('/favicon.ico');

    this.changeMenuColor('#223446');
    return this;
  },

  handleNewPage: function (view) {
    // tell the view switcher to render the new page
    this.pageSwitcher.set(view);

    // update responsive layout (Material Design)
    window.componentHandler.upgradeDom();

    // second rendering pass; absolute sizes in pixels is now available for
    // widgets that need them (ie. the SVG elements)
    if (view.renderContent) {
      view.renderContent();
    }
  },

  // Handles all `<a>` clicks in the app not handled
  // by another view. This lets us determine if this is
  // a click that should be handled internally by the app.
  handleLinkClick: function (e) {
    // This module determines whether a click event is
    // a local click (making sure the for modifier keys, etc)
    // and dealing with browser quirks to determine if this
    // event was from clicking an internal link. That we should
    // treat like local navigation.
    var localPath = localLinks.pathname(e);

    if (localPath) {
      e.preventDefault();
      app.navigate(localPath);
    }
  }

});
