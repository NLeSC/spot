var ContentView = require('./widget-content');
var templates = require('../templates');
var dc = require('dc');
var d3 = require('d3');

module.exports = ContentView.extend({
    template: templates.includes.piechart,

    renderContent: function() {
        var x = parseInt(0.8 * this.el.offsetWidth);
        var y = parseInt(x);

        // dont do anything without a filter defined
        if(! this.model.primary) {
            return;
        }

        // tear down existing stuff
        delete this._chart;

        var chart = dc.pieChart(this.queryByHook('piechart'));
        var that = this; // used in callback
        chart
            .transitionDuration(window.anim_speed)
            .dimension(this._fg1.filter)
            .slicesCap(36)
            .group(this._fg1.group)
            .on('filtered', function(chart) {
                if (chart.hasFilter()) {
                    that.model.selection = chart.filters();
                }
            });

        if(this.model.selection) {
            chart.filter([this.model.selection]);
        }

        chart.render();
        this._chart = chart;
    },
});
