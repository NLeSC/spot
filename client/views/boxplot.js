var app = require('ampersand-app');
var ContentView = require('./widget-content');
var templates = require('../templates');
var dc = require('dc');
var d3 = require('d3');

module.exports = ContentView.extend({
    template: templates.includes.boxplot,

    renderContent: function() {
        var x = parseInt(0.8 * this.el.offsetWidth);
        var y = parseInt(x);

        // dont do anything without two facets defined
        if(! (this.model.primary && this.model.secondary) || this.model.secondary.displayCategorial) {
            return;
        }
        if(! this.model._crossfilter) {
            this.model.initFilter();
        }

        // tear down existing stuff
        delete this._chart;

        // Options:
        // mouseZoomable(true) not working
        var chart = dc.boxPlot(this.queryByHook('boxplot'));
        var that = this; // used in callback
        chart
            .outerPadding(1.0)
            .brushOn(false)
            .elasticX(false)
            .elasticY(false)

            .xUnits(this.model.primary.xUnits)
            .x(this.model.primary.x)
            .y(this.model.secondary.x)

            .dimension(this.model._crossfilter.dimension)
            .group(this.model._crossfilter.group)

            .transitionDuration(app.me.anim_speed)
            .on('filtered', function(chart) {
                if(chart.hasFilter()) {
                    // Filter is an Array[n] of: selected keys, or a single filtered range [xmin,xmax]
                    that.model.range = chart.filters();
                }
                else {
                    that.model.range = undefined;
                }
            });

        // Apply filter settings
        if(this.model.range) {
            this.model.range.forEach(function(f) {
                chart.filter(f);
            });
        }

        chart.render();
 
        this._chart = chart;
    },
    update: function () {
        if(this._chart) {
            this._chart.redraw();
        }
        else {
            this.renderContent();
        }
    },
});
