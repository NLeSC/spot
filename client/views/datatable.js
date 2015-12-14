var ContentView = require('./widget-content');
var templates = require('../templates');
var util = require('../util');
var dc = require('dc');
var d3 = require('d3');

module.exports = ContentView.extend({
    template: templates.includes.datatable,
    bindings: {
        'model.count': {
            type: 'value',
            hook: 'count',
        }
    },
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

        // dont do anything without a facet defined
        if(! this.model.primary) {
            return;
        }
        if(this._crossfilter) {
            this.cleanup();
        }
        this._crossfilter = util.dxGlue1(this.model.primary);

        // tear down existing stuff
        delete this._chart;


        // Make a column for each active facet
        // The table is sorted along the dimension corresponding to this widget
        // so make that the first coloumn.
        // FIXME: should listen to any active facet changes

        var primary = this.model.primary;
        var columns = [primary.value];

        window.app.facets.forEach(function(f) {
            if (f.active && f != primary) {
                columns.push(f.value);
            }
        });

        var order = d3.descending;
        if (this.model.order == "ascending") {
            order = d3.ascending;
        }
      
        var dummy = function () {return 1;};
        var chart = dc.dataTable(this.queryByHook('datatable'));
        chart
            .size(this.model.count)
            .dimension(this._crossfilter.dimension)
            .group(dummy)
            .transitionDuration(window.anim_speed)
            .columns(columns)
            .order(order)
        ;

        chart.render();
        this._chart = chart;
    },

    // Respond to user input
    events: {
        'change': 'uiEvent',
    },

    // events can be counter change, or asc. desc. toggle
    uiEvent: function () {
        var chart = this._chart;

        // Process UI state
        this.model.count = parseInt(this.el.querySelector('[data-hook~="count"]').value);

        var select = this.el.querySelector('[data-hook~="sorter"]');
        this.model.order = select.options[select.selectedIndex].value;

        // Update datatable
        var order = d3.descending;
        if (this.model.order == "ascending") {
            order = d3.ascending;
        }
        chart.size(this.model.count).order(order);
        chart.render();
    },
});
