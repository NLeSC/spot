var ContentView = require('./widget-content');
var templates = require('../templates');
var dc = require('dc');
var d3 = require('d3');

module.exports = ContentView.extend({
    template: templates.includes.barchart,
    renderContent: function() {
        var x = parseInt(0.8 * this.el.offsetWidth);
        var y = parseInt(x);

        // dont do anything without a filter defined
        if(! this.model.primary) {
            return;
        }

        // tear down existing stuff
        delete this._chart;

        // Options:
        // mouseZoomable : does not work well in comibination when using a trackpad
        var chart = dc.barChart(this.queryByHook('barchart'));
        var that = this; // used in callback
        chart
            .brushOn(true)
            .mouseZoomable(false)
            .elasticX(true)
            .elasticY(true)
            .transitionDuration(window.anim_speed)
            .dimension(this._fg1.filter)
            .group(this._fg1.group)
            .on('filtered', function(chart) {
                if(chart.hasFilter()) {
                    // update the model
                    if(chart.isCategorial) {
                        that.model.range = chart.filters();
                    }
                    else {
                        that.model.range = chart.filters()[0];
                    }
                }
                else {
                    that.model.range = undefined;
                }
            });
        

         // Ordinal or regular numbers?
         if(this._fg1.filter.isCategorial) {
             chart
                 .xUnits(dc.units.ordinal)
                 .x(d3.scale.ordinal());
 
             if(this.model.range) {
                 chart.filter([this.model.range]);
             }
         }
         else {
             chart.x(d3.scale.linear());

             if(this.model.range) {
                 chart.filter(this.model.range);
             }
         }
        chart.render();
 
        this._chart = chart;
    },
});
