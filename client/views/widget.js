var View = require('ampersand-view');
var facetSelector = require('./facetselector.js');
var util = require('../util');
var templates = require('../templates');
var app = require('ampersand-app');
var dc = require('dc');


module.exports = View.extend({
    template: templates.includes.widget,
    initialize: function (options) {
        this.collection = app.filters;
        this.once('remove', this.cleanup, this);
    },
    bindings: {
        'model.title': {
            type: 'value',
            hook: 'title-input',
        },
        'model.subtitle': {
            type: 'value',
            hook: 'subtitle-input',
        },
        'model._has_secondary': {
                type: 'toggle',
                hook: 'subtitle',
        },
        // link up mdl javascript behaviour on the page
        'model._title_id' : [
            { type: 'attribute', hook: 'title-input', name: 'id', },
            { type: 'attribute', hook: 'title-label', name: 'for', }
        ],
        'model._subtitle_id' : [
            { type: 'attribute', hook: 'subtitle-input', name: 'id', },
            { type: 'attribute', hook: 'subtitle-label', name: 'for', }
        ],
    },
    events: {
        'click [data-hook~="close"]': 'closeWidget',

        'change [data-hook~="title-input"]': 'changeTitle',
        'change [data-hook~="subtitle-input"]': 'changeSubtitle',
    },
    closeWidget: function () {
        // Send signal to remove widget from collection
        this.model.trigger('removeWidget', this.model);
        this.remove(); // cleanup ourself
    },
    changePrimary:  function (model) {
        // 'this' points to the view containing the list that is clicked on, not to our view. 
        // 'model' is the filter instance that is clicked on
        // NOTE: that.widget is actaully the subview called widget
        var that = this.parent;

        that.model.primary = model.id;
        that.model.title = model.name;

        util.disposeFilterAndGroup(that.widget._fg1);
        that.widget._fg1 = util.facetFilterAndGroup(model.id);

        // propagate change to widget-content
        that.widget.changePrimary(that);

        // mdl: generate an input event to sync label and input elements
        // note that we are binding to 'change' events, so we are not
        //      creating a short-circuit.
        that.queryByHook('title-input').dispatchEvent(new Event('input'));
    },
    changeSecondary: function (model) {
        // 'this' points to the view containing the list that is clicked on, not to our view.
        // 'model' is the filter instance that is clicked on
        // NOTE: that.widget is actaully the subview called widget
        var that = this.parent;

        that.model.secondary = model.id;
        that.model.subtitle = model.name;

        util.disposeFilterAndGroup(that.widget._fg2);
        that.widget._fg2 = util.facetFilterAndGroup(model.id);

        // propagate change to widget-content
        that.widget.changeSecondary(that);

        // mdl: generate an input event to sync label and input elements
        // note that we are binding to 'change' events, so we are not
        //      creating a short-circuit.
        that.queryByHook('subtitle-input').dispatchEvent(new Event('input'));
    },
    changeTertiary: function (model) {
        // 'this' points to the view containing the list that is clicked on, not to our view.
        // 'model' is the filter instance that is clicked on
        // NOTE: that.widget is actaully the subview called widget
        var that = this.parent;

        that.model.tertiary = model.id;

        util.disposeFilterAndGroup(that._fg3);
        that._fg3 = util.facetFilterAndGroup(model.id);

        // propakgate change to widget-content
        that.widget.changeTertiary(that);
    },
    changeTitle: function (e) {
        this.model.title = this.queryByHook('title-input').value;
    },
    changeSubtitle: function (e) {
        this.model.subtitle = this.queryByHook('subtitle-input').value;
    },
    renderContent: function (view) {
        // Propagate to subview
        view.widget.renderContent(view.widget);
    },
    cleanup: function() {
        console.log( "Cleaning up: ", this);
        // Called when this view is 'removed'
        util.disposeFilterAndGroup(this._fg1);
        util.disposeFilterAndGroup(this._fg2);
        util.disposeFilterAndGroup(this._fg3);
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

                // we should add the facet/filter/group object,
                // and draw a selector menu for each facet
                if(model._has_primary) {
                    suboptions.icon = 'swap_horiz';
                    suboptions.callback = view.changePrimary;
                    view.renderSubview(new facetSelector(suboptions), '[data-hook~=primaryfacet]');
                    newview._fg1 = util.facetFilterAndGroup(model.primary);
                }
                if(model._has_secondary) {
                    suboptions.icon = 'swap_vert';
                    suboptions.callback = view.changeSecondary;
                    view.renderSubview(new facetSelector(suboptions), '[data-hook~=secondaryfacet]');
                    newview._fg2 = util.facetFilterAndGroup(model.secondary);
                }
                if(model._has_tertiary) {
                    suboptions.icon = 'format_color_fill',
                    suboptions.callback = view.changeTertiary;
                    view.renderSubview(new facetSelector(suboptions), '[data-hook~=tertiaryfacet]');
                    newview._fg3 = util.facetFilterAndGroup(model.tertiary);
                }

                return newview;
            },
        },
    },
});
