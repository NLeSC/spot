// This app view is responsible for rendering all content that goes into
// <html>. It's initted right away and renders itself on DOM ready.
var app = require('ampersand-app');
var setFavicon = require('favicon-setter');
var View = require('ampersand-view');
var dom = require('ampersand-dom');
var ViewSwitcher = require('ampersand-view-switcher');
var _ = require('lodash');
var domify = require('domify');
var localLinks = require('local-links');
var templates = require('../templates');


module.exports = View.extend({
    template: templates.body,
    autoRender: true,
    initialize: function () {
        // this marks the correct nav item selected
        this.listenTo(app, 'page', this.handleNewPage);
    },
    events: {
        'click a[href]': 'handleLinkClick'
    },
    render: function () {
        // some additional stuff we want to add to the document head
        document.head.appendChild(domify(templates.head()));

        // main renderer
        this.renderWithTemplate(this);

        // init and configure our page switcher
        this.pageSwitcher = new ViewSwitcher(this.queryByHook('page-container'), {
            show: function (newView, oldView) {
                // it's inserted and rendered for me
                document.title = _.result(newView, 'pageTitle') || 'Urban Heat Island analyzer';
                document.scrollTop = 0;

                // add a class specifying it's active
                dom.addClass(newView.el, 'active');

                // store an additional reference, just because
                app.currentPage = newView;
            }
        });

        // setting a favicon for fun (note, it's dynamic)
        setFavicon('/favicon.ico');
        return this;
    },

    handleNewPage: function (view) {
        // tell the view switcher to render the new one
        this.pageSwitcher.set(view);

        // second rendering pass; absolute sizes in pixels is now available for
        // widgets that need them (ie. the SVG elements)
        if (view.renderContent) {
            view.renderContent(view);
        }

        // Material Design
        window.componentHandler.upgradeDom();
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
    },

});
