var ContentView = require('./widget-content');
var templates = require('../templates');
var dc = require('dc');
var d3 = require('d3');

module.exports = ContentView.extend({
    template: templates.includes.histogram,
    renderContent: function(view) {

        // dont do anything without a filter defined
        if(! view.model.filter) {
            return;
        }

        // tear down existing stuff
        if(view._chart) {
            view._chart.filterAll();
            delete view._chart;
            // TODO: remove from dom?
        }

        var filter = window.app.filters.get(view.model.filter);
        var _dx = filter.get('_dx');

        // Create a grouping using 100 bins spanning the [min,max] range
        // This prevents the default identity grouping giving len(data) groups for floats,
        // and makes rendering and calculating much faster.
        var binsize = (filter._range[1] - filter._range[0]) / 100.0;

        var grouping = function (d) {
            var bin =  Math.round( (d-filter._range[0]) / binsize );
            return filter._range[0] + bin * binsize;
        };
        var group = _dx.group( grouping );

        // Options:
        // mouseZoomable : does not work well in comibination when using a trackpad
        // elasticX : when set to true, and the data contains Infinity, goes bonkers.
        var chart = dc.barChart(this.queryByHook('barchart'));
        chart
            .height(250)
            .brushOn(true)
            .mouseZoomable(false)
            .elasticX(false)
            .elasticY(true)
            .transitionDuration(window.anim_speed)
            .dimension(_dx)
            .group(group)
            .on('filtered', function(chart) {
                if(chart.hasFilter()) {
                    // update the model
                    if(chart.isOrdinal) {
                        view.model.range = chart.filters();
                    }
                    else {
                        view.model.range = chart.filters()[0];
                    }
                }
                else {
                    view.model.range = undefined;
                }
            });
        

        // Ordinal or regular numbers?
        var isOrdinal = window.app.filters.get(view.model.filter).get('isOrdinal');
        if(isOrdinal) {
            chart
                .xUnits(dc.units.ordinal)
                .x(d3.scale.ordinal());

            if(view.model.range) {
                chart.filter([view.model.range]);
            }
        }
        else {
            chart
                .xUnits(dc.units.fp.precision(binsize))
                .x(d3.scale.linear().domain(filter._range));

            if(view.model.range) {
                chart.filter(view.model.range);
            }
        }

        // keep a handle on the chart, will be cleaned up by the widget-content base class.
        chart.render();
        view._chart = chart;
    },
});


