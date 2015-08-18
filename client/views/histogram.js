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
            view.model.filtermin = undefined;
            view.model.filtermax = undefined;
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
            .group(group, view.model.filter)
            .on('postRedraw', function(chart) {

                // listen to 'postRedraw', not 'filtered':
                // when the chart is removed, it also removes it filter and emits a 'filtered' event

                if(chart.hasFilter()) {

                    // get the active (and only) filter and update the model
                    var range = chart.filters()[0];
                   
                    view.model.filtermin = range[0];
                    view.model.filtermax = range[1];
                }
                else {
                    view.model.filtermin = undefined;
                    view.model.filtermax = undefined;
                }
            });

        // Ordinal or regular numbers?
        var isOrdinal = window.app.filters.get(view.model.filter).get('isOrdinal');
        if(isOrdinal) {
            chart
                .xUnits(dc.units.ordinal)
                .x(d3.scale.ordinal());
        }
        else {
            chart
                .xUnits(dc.units.fp.precision(binsize))
                .x(d3.scale.linear().domain(filter._range));
        }

        if (typeof view.model.filtermin != 'undefined') {
            chart.filter([view.model.filtermin, view.model.filtermax]);
        }

        chart.render();
        view._chart = chart;
    },
});


