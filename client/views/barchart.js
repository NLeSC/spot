var app = require('ampersand-app');
var ContentView = require('./widget-content');
var templates = require('../templates');
var dc = require('dc');
var d3 = require('d3');

module.exports = ContentView.extend({
    template: templates.includes.barchart,

    renderContent: function() {
        var x = parseInt(0.8 * this.el.offsetWidth);
        var y = parseInt(x);

        // dont do anything without a facet defined
        if(! this.model.primary) {
            return;
        }
        if(! this.model._crossfilter) {
            this.model.initFilter();
        }

        // tear down existing stuff
        delete this._chart;

        // Options:
        // mouseZoomable : does not work well in comibination when using a trackpad
        var chart = dc.barChart(this.queryByHook('barchart'));
        var that = this; // used in callback
        chart
            .outerPadding(1.0)
            .brushOn(true)
            .mouseZoomable(false)
            .elasticX(false)
            .elasticY(true)

            .xUnits(this.model.primary.xUnits)
            .x(this.model.primary.x)

            .transitionDuration(app.me.anim_speed);

        // Stacked barchart
        if(this.model.secondary && this.model.secondary.displayCategorial) {

            var domain = this.model.secondary.x.domain();

            // NOTE: we need generator functions because of the peculiar javascript scoping rules in loops, 
            //       and 'let' instead of 'var' not being supported yet in my browser
            var stackFn;

            if (this.model.secondary.reducePercentage) {
                stackFn = function (i) {
                    return function (d) {return 100 * d.value[domain[i]] / d.value._total;};
                };
            }
            else if (this.model.secondary.reduceAbsolute) {
               stackFn = function (i) {
                    return function (d) {return d.value[domain[i]];};
                };
            }
            else {
                console.log( "barchart: Reduction not supported for facet", this.model.secondary.reduction, this.model.secondary);
            }

            chart
                .hidableStacks(false)  // FIXME: unexplained crashed when true, and a category is selected from the legend
                .dimension(this.model._crossfilter.dimension)
                .group(this.model._crossfilter.group, domain[0])
                .valueAccessor(stackFn(0));

            for(var i=1; i < domain.length; i++) {
                chart.stack(this.model._crossfilter.group, domain[i], stackFn(i));
            }

            chart.legend(dc.legend().x(100).y(0).itemHeight(13).gap(5));
        }

        // Regular barchart, if secondary is falsy
        // Else, group by facetA, take value of facetB
        else {
            chart
                .dimension(this.model._crossfilter.dimension)
                .group(this.model._crossfilter.group)
                .valueAccessor(this.model._crossfilter.valueAccessor);
        }

        // Center for continuous, don't for ordinal plots
        chart.centerBar(! chart.isOrdinal());

        // custom filter handler
        chart.filterHandler(function (dimension, filters) {
            that.model.range = filters;
            that.model.setFilter.call(that.model);
            return filters;
        });

        // apply filters
        this.model.range.forEach(function(f) {
            chart.filter(f);
        });

        chart.render();
 
        this._chart = chart;
    },
});
