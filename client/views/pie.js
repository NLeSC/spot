var View = require('ampersand-view');
var templates = require('../templates');
var dc = require('dc');
var d3 = require('d3');

module.exports = View.extend({
    template: templates.includes.pie,
    bindings: {
        'model.missing': '[data-hook~=missing]',
    },
    initialize: function() {
        // when the view is removed, also do our own cleanup
        this.once('remove',this.cleanup, this);
    },
    cleanup: function () {
        if(this._chart) {
            // remove filter
            this._chart.filterAll();

            // remove chart
            delete this._chart;

            // re-render other plots
            // NOTE: dc.renderAll() makes other widgets using the same crossfilter misbehave
            dc.redrawAll();
        }
    },
    render: function() {
        this.renderWithTemplate(this);

        return this;
    },
    renderContent: function(view) {

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

        var _dx = window.app.filters.get(view.model.filter).get('_dx');
        var group = _dx.group();

        var chart = dc.pieChart(this.queryByHook('piechart'));
        chart
            .height(250)
            .transitionDuration(0)
            .dimension(_dx)
            .slicesCap(36)
            .group(group);

        chart.render();
        view._chart = chart;
    },
});


