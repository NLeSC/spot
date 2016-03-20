var app = require('ampersand-app');
var ContentView = require('./widget-content');
var templates = require('../templates');
var Chart = require('chart.js');
var util = require('../util');
var chroma = require('chroma-js');

module.exports = ContentView.extend({
    template: templates.includes.piechart_chartjs,
    renderContent: function() {
        // tear down existing stuff
        delete this._chartjs;
        delete this._config;

        this._config = {
            type:'pie',
            data: {
                datasets: [{data: [], backgroundColor: []}],
                labels: []
            },
            options: {
                responsive: true,
                onClick: this.clicked
            }
        };

        // Create and add to plot
        var ctx = this.queryByHook('chart-area').getContext("2d");
        var myPieChart = new Chart(ctx, this._config);
        myPieChart._Ampersandview = this;

        this._chartjs = myPieChart;
    },
    clicked: function(ev,elements){    // this -> piechart
        var that = this._Ampersandview;
        if(elements.length > 0) {
            util.filter1dCategorialHandler(that.model.selection, elements[0]._view.label, that.model.primary.categories);
            that.model.setFilter();
        }
        else {
            // FIXME: a mouse click fires mulitple events, find out how to get only the relevant one 
            // that.model.selection = [];
        }
    },
    update: function() {
        var data = this._config.data.datasets[0].data;
        var bgColor = this._config.data.datasets[0].backgroundColor;
        var labels = this._config.data.labels;

        var filters = this.model.selection;

        if(this.model.primary) {
            if(! this.model._crossfilter) {
                this.model.initFilter();
            }

            var groups = this.model._crossfilter.group.all();
            var valueFn = this.model._crossfilter.valueAccessor;

            // assingning a new array would trigger a too big animation
            // so keep the original arrays, but empty them.
            data.splice(0,data.length);
            bgColor.splice(0,bgColor.length);
            labels.splice(0,labels.length);

            groups.forEach(function (g) {
                var base_color = chroma('pink');
                var color;

                // Keys removed by current filters should be brighter 
                if (filters.indexOf(g.key) == -1) {
                    color = base_color.brighten(2).hex();
                }
                else {
                    color = base_color.hex();
                }

                // Data for a new group
                data.push(valueFn(g));
                labels.push(g.key);
                bgColor.push(color);
            });
        }
        this._chartjs.update();
    },
});
