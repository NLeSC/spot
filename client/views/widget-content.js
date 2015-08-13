var View = require('ampersand-view');
var dc = require('dc');

module.exports = View.extend({

    initialize: function () {
        // register with DC to receive filter events
        dc.registerChart(this);

        this.once('remove', function() {

            // remove listener when widget is removed
            dc.deregisterChart(this);

            if(this._chart) {

                // remove filter
                this._chart.filterAll();

                // remove chart
                delete this._chart;

                // re-render other plots
                // NOTE: dc.renderAll() makes other widgets using the same crossfilter misbehave
                dc.redrawAll();
            }
        });
    },

    // Call-back for dc on filter events
    // Use this to update the widget
    redraw: function () {
    },

    // 
    cleanup: function () {
    },

    // First rendering pass: add responsive widget to the DOM
    // The template and CSS can use relative sizes, be responsive, etc.
    render: function () {
        if(this.template) {
            this.renderWithTemplate(this);
        }

        return this;
    },

    // Second rendering pass: add fixed-width elements to the DOM
    // Things like SVG canvas, OpenLayers Maps
    // Should call renderContent on each subwidget (if any)

    // NOTE: it is passed the view instead of using 'this' as calls from outside of ampersand
    // can set 'this' to some other object.
    renderContent: function (view) {
    },

    // Used by DC when (de)registering
    anchorName: function () {
        return this.cid;
    }
});

