var ContentView = require('./widget-content');
var templates = require('../templates');
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
    renderContent: function(view) {

        var el = view.queryByHook('datatable');
        var height = 250;
        var width = parseInt(el.offsetWidth);

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

        // Make a column for each active filter
        // The table is sorted along the dimension corresponding to this widget
        // so make that the first coloumn.
        var columns = [view.model.filter.toLowerCase()];
        window.app.filters.forEach( function(f) {
            if (f.active && f.id != view.model.filter) {
                columns.push( f.id.toLowerCase() );
            }
        });

        var order;
        if (view.model.order == "ascending") {
            order = d3.ascending;
        }
        else {
            order = d3.descending;
        }
       
        var _dx = window.app.filters.get(view.model.filter).get('_dx');
        var dummy = function () {return "";};
        var chart = dc.dataTable(this.queryByHook('datatable'));
        chart
            .size(view.model.count)
            .dimension(_dx)
            .group(dummy)
            .transitionDuration(0)
            .columns(columns)
            .order(order)
        ;

        chart.render();
        view._chart = chart;
    },

    // Respond to user input
    events: {
        'change': 'uiEvent',
    },

    // events can be counter change, or asc. desc. toggle
    uiEvent: function () {
        var chart = this._chart;

        // Process UI state
        var input = this.el.querySelector('[data-hook~="count"]');
        this.model.count = parseInt(input.value);

        var order = this.el.querySelector('[data-hook~="sorter"]');
        this.model.order = order.value;

        // Update datatable
        if (this.model.order == "ascending") {
            chart.order(d3.ascending);
        }
        else {
            chart.order(d3.descending);
        }
        chart.size(this.model.count);
        chart.redraw();
    },
});
