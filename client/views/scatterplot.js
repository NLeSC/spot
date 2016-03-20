var app = require('ampersand-app');
var ContentView = require('./widget-content');
var templates = require('../templates');
var util = require('../util');
var dc = require('dc');
var d3 = require('d3');

module.exports = ContentView.extend({
    template: templates.includes.scatterplot,
    renderContent: function() {
        var x = parseInt(0.8 * this.el.offsetWidth);
        var y = parseInt(x);

        // dont do anything without a facet defined
        if(! (this.model.primary && this.model.secondary)) {
            return;
        }
        if(! this.model._crossfilter) {
            this.model.initFilter();
        }

        delete this._chart;
        var model = this.model; // used in callback for chart and crossfilter

        // We need to wrap the default group to deal with missing values:
        // missing values are set equal to util.misval (typically Number.MAX_VAL), 
        // and will lead to out-of-range errors when rendering, and the rendering aborts on error.
        // Also remove empty groups
        var wrapped_group = {
            all: function () {
                var all = model._crossfilter.group.all();
                var fixed = [];
                all.forEach(function(e, index, array) {
                    if( e.key[0] !== util.misval && e.key[1] != util.misval && e.value.count !== 0) {
                        fixed.push({key: e.key, value: e.value});
                    }
                });
                return fixed;
            }
        };

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
            .transitionDuration(app.me.anim_speed)
            .dimension(this.model._crossfilter.dimension)
            .group(wrapped_group);

        // custom filter handler
        chart.filterHandler(function (dimension, filters) {
            // we get   [[xmin,ymin],[xmax,ymax]]
            // we want  [[xmin,xmax],[ymin,ymax]]
            if(filters.length == 1) {
                var f = filters[0];
                model.range = [[f[0][0], f[1][0]], [f[0][1], f[1][1]]];
            }
            else {
                model.range = [];
            }
            model.setFilter.call(model);
            return filters;
        });

        // apply filters
        this.model.range.forEach(function(f) {
            // we get  [[xmin,xmax],[ymin,ymax]]
            // we want [[xmin,ymin],[xmax,ymax]]
            chart.filter([[f[0][0],f[1][0]],[f[0][1],f[1][1]]]);
        });

        // keep a handle on the chart, will be cleaned up by the widget-content base class.
        this._chart = chart;
        chart.render();
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
