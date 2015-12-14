var app = require('ampersand-app');
var ContentView = require('./widget-content');
var templates = require('../templates');
var util = require('../util');
var dc = require('dc');
var d3 = require('d3');

module.exports = ContentView.extend({
    template: templates.includes.scatterplot,
    bindings: {
    },
    renderContent: function() {
        var x = parseInt(0.8 * this.el.offsetWidth);
        var y = parseInt(x);

        // dont do anything without a filter defined
        if(! this.model.isReady) {
            return;
        }

        delete this._chart;

        // FIXME: crossfilter access
        if(this._crossfilter) {
            this.cleanup();
        }
        this._crossfilter = util.dxGlue2(this.model.primary, this.model.secondary);

        console.log( this._crossfilter.group.all() );

        var that = this; // used in callback for chart and crossfilter

        // Options:
        // mouseZoomable : does not work well in comibination when using a trackpad
        // elasticX : when set to true, and the data contains Infinity, goes bonkers.
        var chart = dc.scatterPlot(this.queryByHook('scatterplot'));
        chart
            .brushOn(true)
            .mouseZoomable(false)
            .elasticX(false)
            .elasticY(false)
            .x(this.model.primary.x)
            .y(this.model.secondary.x)
            .transitionDuration(window.anim_speed)
            .dimension(this._crossfilter.dimension)
            .group(this._crossfilter.group)
            .on('filtered', function(chart) {
                if(chart.hasFilter()) {
                    // update the model
                    that.model.range = chart.filters()[0];
                }
                else {
                    that.model.range = undefined;
                }
            });

        // keep a handle on the chart, will be cleaned up by the widget-content base class.
        chart.render();
        this._chart = chart;
    },

    cleanup: function () {
        if (this._crossfilter) {
            this._crossfilter.dimension.filterAll();
            this._crossfilter.dimension.dispose();
            delete this._crossfilter.dimension;
        }
    },
});
