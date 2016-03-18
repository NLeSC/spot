var app = require('ampersand-app');
var ContentView = require('./widget-content');
var templates = require('../templates');
var Chart = require('chart.js');

module.exports = ContentView.extend({
    template: templates.includes.piechart_chartjs,
    render: function () {
        this.renderWithTemplate(this);

    },
    renderContent: function() {
        var x = parseInt(0.8 * this.el.offsetWidth);
        var y = parseInt(x);

        // dont do anything without a facet defined
        if(! this.model.primary) {
            return;
        }
        if(! this.model._crossfilter) {
            this.model.initFilter();
        }

        // tear down existing stuff
        delete this._chartjs;

        // format data
        var newDataset = { data: [], backgroundColor: [] }; 
        var labels = [];

        var groups = this.model._crossfilter.group.all();
        var valueFn = this.model._crossfilter.valueAccessor;

        groups.forEach( function (g) {
            newDataset.data.push(valueFn(g));
            newDataset.backgroundColor.push('#949FB1');
            labels.push(g.key);
        });

        // Create and add to plot
        var ctx = this.queryByHook('chart-area').getContext("2d");
        var myPieChart = new Chart(ctx, {
            type:'pie',
            data: {
                datasets: [ newDataset ],
                labels: labels,
            },
            options: {
                responsive: true
            }
        });

        this._chartjs = myPieChart;
    },
    redraw: function () {
    },
});
