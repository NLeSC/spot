var ContentView = require('./widget-content');
var templates = require('../templates');
var util = require('../util');
var dc = require('dc');

module.exports = ContentView.extend({
    template: templates.includes.piechart,

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

        var chart = dc.pieChart(this.queryByHook('piechart'));
        var that = this; // used in callback
        chart
            .transitionDuration(window.anim_speed)
            .dimension(this._crossfilter.dimension)
            .slicesCap(36)
            .group(this._crossfilter.group)
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
