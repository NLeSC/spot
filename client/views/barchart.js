var ContentView = require('./widget-content');
var templates = require('../templates');
var util = require('../util');
var dc = require('dc');
var d3 = require('d3');

module.exports = ContentView.extend({
    template: templates.includes.barchart,
    renderContent: function(view) {
        var x = parseInt(0.8 * this.el.offsetWidth);
        var y = parseInt(x);

        // dont do anything without a filter defined
        if(! view.model.primary) {
            return;
        }

        // tear down existing stuff
        delete view._chart;

        // Options:
        // mouseZoomable : does not work well in comibination when using a trackpad
        var chart = dc.barChart(this.queryByHook('barchart'));
        chart
            .brushOn(true)
            .mouseZoomable(false)
            .elasticX(true)
            .elasticY(true)
            .transitionDuration(window.anim_speed)
            .dimension(view._fg1.filter)
            .group(view._fg1.group)
            .on('filtered', function(chart) {
                if(chart.hasFilter()) {
                    // update the model
                    if(chart.isCategorial) {
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
         if(view._fg1.filter.isCategorial) {
             chart
                 .xUnits(dc.units.ordinal)
                 .x(d3.scale.ordinal());
 
             if(view.model.range) {
                 chart.filter([view.model.range]);
             }
         }
         else {
             chart.x(d3.scale.linear());

             if(view.model.range) {
                 chart.filter(view.model.range);
             }
         }
        chart.render();
 
        view._chart = chart;
    },
    changePrimary: function () {
        util.disposeFilterAndGroup(this._fg1);
        this._fg1 = util.facetFilterAndGroup(this.model.primary);
        this.renderContent(this);
    },
    cleanup: function () {
        util.disposeFilterAndGroup(this._fg1);
    },
});
