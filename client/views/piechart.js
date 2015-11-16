var ContentView = require('./widget-content');
var templates = require('../templates');
var dc = require('dc');
var d3 = require('d3');

module.exports = ContentView.extend({
    template: templates.includes.piechart,

    renderContent: function(view) {
        var x = parseInt(0.8 * this.el.offsetWidth);
        var y = parseInt(x);

        // dont do anything without a filter defined
        if(! view.model.primary) {
            return;
        }

        // tear down existing stuff
        delete view._chart;

        var chart = dc.pieChart(this.queryByHook('piechart'));
        chart
            .transitionDuration(window.anim_speed)
            .dimension(view._fg1.filter)
            .slicesCap(36)
            .group(view._fg1.group)
            .on('filtered', function(chart) {
                if (chart.hasFilter()) {
                    view.model.selection = chart.filters();
                }
            });

        if(view.model.selection) {
            chart.filter([view.model.selection]);
        }

        chart.render();
        view._chart = chart;
    },
});
