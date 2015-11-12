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
        var x = parseInt(0.8 * this.el.offsetWidth);
        var y = parseInt(x);

        // dont do anything without a filter defined
        if(! view.model.primary) {
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
        var columns = [view.model.primary.toLowerCase()];
        window.app.filters.forEach( function(f) {
            if (f.active && f.id != view.model.primary) {
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
       
        var _dx = window.app.filters.get(view.model.primary).get('_dx');
        var dummy = function () {return "";};
        var chart = dc.dataTable(this.queryByHook('datatable'));
        chart
            .size(view.model.count)
            .dimension(_dx)
            .group(dummy)
            .transitionDuration(window.anim_speed)
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
        this.model.count = parseInt(this.el.querySelector('[data-hook~="count"]').value);

        var select = this.el.querySelector('[data-hook~="sorter"]');
        this.model.order = select.options[select.selectedIndex].value;

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
