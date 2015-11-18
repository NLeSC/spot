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
    renderContent: function() {
        var x = parseInt(0.8 * this.el.offsetWidth);
        var y = parseInt(x);

        // dont do anything without a filter defined
        if(! this.model.primary) {
            return;
        }

        // tear down existing stuff
        delete this._chart;

        // Make a column for each active filter
        // The table is sorted along the dimension corresponding to this widget
        // so make that the first coloumn.
        // FIXME: should listen to any active filter changes
        var id = this.model.primary;
        var facet = window.app.filters.get(id);
        var columns = [util.facetValueFn(facet)];

        window.app.filters.forEach(function(f) {
            if (f.active && f.id != this.model.primary) {
                columns.push(util.facetValueFn(f));
            }
        });

        var order = d3.descending;
        if (this.model.order == "ascending") {
            order = d3.ascending;
        }
      
        var dummy = function () {return "";};
        var chart = dc.dataTable(this.queryByHook('datatable'));
        chart
            .size(this.model.count)
            .dimension(this._fg1.filter)
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
