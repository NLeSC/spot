var ContentView = require('./widget-content');
var templates = require('../templates');
var util = require('../util');
var dc = require('dc');
var d3 = require('d3');

module.exports = ContentView.extend({
    template: templates.includes.barchart,

    cleanup: function () {
        if (this._crossfilter) {
            this._crossfilter.dimension.filterAll();
            this._crossfilter.dimension.dispose();
            delete this._crossfilter.dimension;
        }
    },
    renderContent: function() {
        var x = parseInt(0.8 * this.el.offsetWidth);
        var y = parseInt(x);

        // dont do anything without a filter defined
        if(! this.model.primary) {
            return;
        }
        if(this._crossfilter) {
            this.cleanup();
        }
        this._crossfilter = util.dxGlue1(this.model.primary);

        // tear down existing stuff
        delete this._chart;

        // Options:
        // mouseZoomable : does not work well in comibination when using a trackpad
        var chart = dc.barChart(this.queryByHook('barchart'));
        var that = this; // used in callback
        chart
            .centerBar(true)
            .outerPadding(1.0)
            .brushOn(true)
            .mouseZoomable(false)
            .elasticX(false)
            .elasticY(true)

            .dimension(this._crossfilter.dimension)
            .group(this._crossfilter.group)
            .xUnits(this.model.primary.xUnits)
            .x(this.model.primary.x)

            .transitionDuration(window.anim_speed)
            .on('filtered', function(chart) {
                if(chart.hasFilter()) {
                    // update the model
                    if(chart.isOrdinal()) {
                        // Filter is an Array[n] of selected keys
                        that.model.range = chart.filters();
                    }
                    else {
                        // Filter is an Array[1] of [min,max]
                        that.model.range = chart.filters()[0];
                    }
                }
                else {
                    that.model.range = undefined;
                }
            });
        

        // Ordinal or regular numbers?
        if(this.model.primary.isCategorial) {
            if(this.model.range) {
                this.model.range.forEach(function(f) {
                    chart.filter(f);
                });
            }
        }
        else {
            if(this.model.range) {
                chart.filter(this.model.range);
            }
        }

        chart.render();
 
        this._chart = chart;
    },
});
