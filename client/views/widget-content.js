var View = require('ampersand-view');
var dc = require('dc');

// DC charts should be added to the view as view._chart
// the base widget then takes care of chart and facet life cycles

module.exports = View.extend({

    initialize: function () {
        // register with DC to receive filter events
        dc.registerChart(this);

        this.once('remove', function() {
            // remove listener when widget is removed
            dc.deregisterChart(this);

            if(this._chart) {

                // stop listening to events
                this._chart.on('filtered', null);

                // remove chart
                delete this._chart;
            }
            if(this._chartjs) {
                // remove chart
                delete this._chartjs;
            }

            // re-render other plots
            // NOTE: dc.renderAll() makes other widgets using the same crossfilter misbehave
            dc.redrawAll();
        });
    },

    // Call-back for dc on filter events
    // override to do custom rendering
    redraw: function () {
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
    renderContent: function () {
    },

    // Used by DC when (de)registering
    anchorName: function () {
        return this.cid;
    }
});
