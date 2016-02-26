var View = require('ampersand-view');
var facetSelector = require('./facetselector.js');
var Facet = require('../models/facet.js');
var util = require('../util');
var templates = require('../templates');
var app = require('ampersand-app');
var dc = require('dc');


module.exports = View.extend({
    template: templates.includes.widgetframe,
    initialize: function (options) {
        this.collection = app.facets;
        this.once('remove', this.cleanup, this);
    },
    bindings: {
        'model.title': {
            type: 'value',
            hook: 'title-input',
        },
        // link up mdl javascript behaviour on the page
        'model._title_id' : [
            { type: 'attribute', hook: 'title-input', name: 'id', },
            { type: 'attribute', hook: 'title-label', name: 'for', }
        ],
    },
    events: {
        'click [data-hook~="close"]': 'closeWidget',

        'contextmenu [data-hook~="primaryfacet"]': 'editPrimary',
        'contextmenu [data-hook~="secondaryfacet"]': 'editSecondary',
        'contextmenu [data-hook~="tertiaryfacet"]': 'editTertiary',

        'change [data-hook~="title-input"]': 'changeTitle',
    },
    closeWidget: function () {
        // Remove the widget from the widget collection that is maintained by the parent view
        this.parent.collection.remove(this.model);

        // Remove the view from the dom
        this.remove();
    },
    editPrimary: function (e) {
        e.preventDefault(); // prevent browser right-mouse button menu from opening
        app.navigate(this.model.primary.editURL);
    },
    editSecondary: function (e) {
        e.preventDefault(); // prevent browser right-mouse button menu from opening
        app.navigate(this.model.secondary.editURL);
    },
    editTertiary: function (e) {
        e.preventDefault(); // prevent browser right-mouse button menu from opening
        app.navigate(this.model.tertiary.editURL);
    },
    changePrimary:  function (newPrimary) {
        this.model.primary = newPrimary;
        this.model.title = newPrimary.name;

        // propagate change to widget-content
        this.widget.changedPrimary.call(this);

        // mdl: generate an input event to sync label and input elements
        // note that we are binding to 'change' events, so we are not
        //      creating a short-circuit.
        this.queryByHook('title-input').dispatchEvent(new Event('input'));
    },
    changeSecondary: function (newSecondary) {
        this.model.secondary = newSecondary;

        // propagate change to widget-content
        this.widget.changedSecondary.call(this);
    },
    changeTertiary: function (newTertiary) {
        this.model.tertiary = newTertiary;

        // propakgate change to widget-content
        this.widget.changedTertiary.call(this);
    },
    changeTitle: function (e) {
        this.model.title = this.queryByHook('title-input').value;
    },
    renderContent: function () {
        // Propagate to subview
        this.widget.renderContent.call(this.widget);
    },
    cleanup: function() {
        // Called when this view is 'removed'
    },
    subviews: {
        widget: {
            hook: 'widget',
            constructor: function(options) {
                var view = options.parent;
                var model = view.model;
                options.type = model.type;
                options.model = model;

                var suboptions = {
                    collection: view.collection,
                };

                // The new view containing the requested widget
                var newview = app.widgetFactory.newView(options.parent.model.type, options);

                // we should add the facet/group object,
                // and draw a selector menu for each facet
                if(model._has_primary) {
                    suboptions.icon = 'swap_horiz';
                    suboptions.callback = view.changePrimary;
                    view.renderSubview(new facetSelector(suboptions), '[data-hook~=primaryfacet]');
                }
                if(model._has_secondary) {
                    suboptions.icon = 'swap_vert';
                    suboptions.callback = view.changeSecondary;
                    view.renderSubview(new facetSelector(suboptions), '[data-hook~=secondaryfacet]');
                }
                if(model._has_tertiary) {
                    suboptions.icon = 'format_color_fill',
                    suboptions.callback = view.changeTertiary;
                    view.renderSubview(new facetSelector(suboptions), '[data-hook~=tertiaryfacet]');
                }

                return newview;
            },
        },
    },
});
