var View = require('ampersand-view');
var templates = require('../templates');
var dc = require('dc');
var d3 = require('d3');

module.exports = View.extend({
    template: templates.includes.histogram,
    bindings: {
        'model.filter': '[data-hook~=blank]',
        'model.missing': '[data-hook~=missing]',
    },
    initialize: function() {
        var self = this;

        // re-render when a different filter is selected
        this.model.on( 'change:filter', function() {self.cleanup(); self.render();} );

        // when the view is removed, also do our own cleanup
        this.once('remove',this.cleanup, this);
    },
    cleanup: function () {
        if( this._chart ) {
            // remove filter
            this._chart.filterAll();

            // remove chart
            delete this._chart;

            // re-render other plots: start from scratch dont update 
            // Cannot use redrawAll as that would not set the proper width
            dc.renderAll();
        }
    },
    render: function() {
        this.renderWithTemplate(this);
        return this;
    },
    renderContent: function(view) {
        if(view.model.filter) {

            var _dx = window.app.filters.get(view.model.filter).get('_dx');
            var group;

            // Deal with missing data (set to Infinity):
            // get the (sorted) groupings (key, value), where the last element, [lenght-1],
            // counts the number of missing data points, if any.
            group = _dx.group();
            var all = group.all();
            group.dispose();

            var min = all[0].key;
            var max;
            if( all[all.length-1].key == Infinity ) {
                max  = all[all.length - 2].key;
                view.model.missing = all[all.length-1].value;
            }
            else {
                max = all[all.length - 1].key;
                view.model.missing = 0;
            }

            // Create a grouping using 200 bins spanning the [min,max] range
            // This prevents the default identity grouping giving len(data) groups for floats,
            // and makes rendering and calculating much faster.
            var binsize = (max - min) / 200.0;

            var grouping = function (d) {
                var bin =  Math.round( (d-min) / binsize );
                return min + bin * binsize;
            };
            group = _dx.group( grouping );

            // Options:
            // mouseZoomable : does not work well in comibination when using a trackpad
            // elasticX : when set to true, and the data contains Infinity, goes bonkers.

            var chart = dc.barChart(view.queryByHook('barchart'));
            chart
                .height(250)
                .brushOn(true)
                .mouseZoomable(false)
                .elasticX(false)
                .elasticY(true)
                .dimension(_dx)
                .group(group, view.model.filter)
                .x(d3.scale.linear().domain([min,max]))
                .transitionDuration(0)
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

            if (typeof view.model.filtermin != 'undefined') {
                chart.filter([view.model.filtermin, view.model.filtermax]);
            }

            view._chart = chart;
            chart.render();
        }
    },
});


