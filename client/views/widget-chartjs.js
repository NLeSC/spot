var app = require('ampersand-app');
var ContentView = require('./widget-content');
var templates = require('../templates');
var Chart = require('chart.js');
var util = require('../util');
var chroma = require('chroma-js');

module.exports = ContentView.extend({
    template: templates.includes.widgetcontent,
    renderContent: function() {
        // tear down existing stuff
        delete this._chartjs;
        delete this._config;

        this._config = this.model.chartjs_config();
        this._config.options.onClick = this.clicked;

        // Create and add to plot
        var ctx = this.queryByHook('chart-area').getContext("2d");
        var myPieChart = new Chart(ctx, this._config);
        myPieChart._Ampersandview = this;

        this._chartjs = myPieChart;
    },
    clicked: function(ev,elements){    // this -> piechart
        var that = this._Ampersandview.model;

        if(elements.length > 0) {
            var clickedGroup = elements[0]._chart.config.data.labels[elements[0]._index];
            that.updateFilter.call(that,clickedGroup);
            that.setFilter();
        }
        else {
            that.selection = [];
            that.setFilter();
        }
    },
    update: function() {
        if(! this._chartjs) {
            this.renderContent();
        }
        if ((! this.model._crossfilter) && (! this.model.initFilter()) )  {
            return;
        }

        // var colors = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];
        // data.labels
        // data.datasets[n].label
        // data.datasets[n].data
        // data.datasets[n].backgroundColor

        var model = this.model;
        var chart_data = this._config.data;
        var groups = model._crossfilter.data();

        // temporary variables
        var cut;

        // labels along the xAxes
        chart_data.labels.splice(0,chart_data.labels.length);
        groups.forEach(function (g,i) {
            chart_data.labels[i] = g.key;
        });

        // labels along yAxes
        var subgroups = Object.keys(groups[0].values);

        // match the existing number of datasets to the updated number of subgroups
        if(chart_data.datasets) {
            cut = chart_data.datasets.length - subgroups.length;
            if(cut > 0) {
                chart_data.datasets.splice(0, cut);
            }
        }

        subgroups.forEach(function(subgroup,i) {
            var cut;

            // prepare data structure, reuse as much of the previous data arrays as possible
            // to prevent massive animations on every update

            if(chart_data.datasets[i]) {
                // match the existing number of groups to the updated number of groups
                cut = chart_data.datasets[i].data.length - groups.length;
                if (cut > 0) {
                    chart_data.datasets[i].data.splice(0, cut);
                    chart_data.datasets[i].backgroundColor.splice(0, cut);
                }
            }
            else {
                chart_data.datasets[i] = {
                    data: [],
                    backgroundColor: [],
                };
            }

            // legend entry for subgroups
            chart_data.datasets[i].label = subgroup;

            // data and color for subgroup
            groups.forEach(function(group,j) {
                var color;
                if (util.isSelected(model, group.key)) {
                    color = chroma('#8dd3c7');
                }
                else {
                    color = chroma('#aaaaaa');
                }
                chart_data.datasets[i].data[j] = group.values[subgroup];
                chart_data.datasets[i].backgroundColor[j] = color.hex();
            });
        });

        this._chartjs.update();
    },
});
