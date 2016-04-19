var app = require('ampersand-app');
var ContentView = require('./widget-content');
var templates = require('../templates');
var Chart = require('chart.js');
var util = require('../util');
var colors = require('../colors');
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
        var myChart = new Chart(ctx, this._config);
        myChart._Ampersandview = this;

        this._chartjs = myChart;
    },
    clicked: function(ev,elements){    // this -> chart
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

        var model = this.model;

        var chart_data = this._config.data;
        var groups = model._crossfilter.data();

        // temporary variables
        var AtoI = {}, BtoJ = {};

        // prepare data structure, reuse as much of the previous data arrays as possible
        // to prevent massive animations on every update

        // labels along the xAxes
        var xbins = this.model.primary.bins;
        var cut = chart_data.labels.length - xbins.length;
        if(cut > 0) {
            chart_data.labels.splice(0,cut);
        }
        xbins.forEach(function (xbin,i) {
            chart_data.labels[i] = xbin.label; 
            AtoI[xbin.label] = i;
        });

        // labels along yAxes
        var ybins = [{label:1}];
        if (this.model.secondary) {
            ybins = this.model.secondary.bins;
        }
        ybins.forEach(function(ybin,j) {
            if(chart_data.datasets[j]) {
                // match the existing number of groups to the updated number of groups
                var cut = chart_data.datasets[j].data.length - xbins.length;
                if (cut > 0) {
                    chart_data.datasets[j].data.splice(0, cut);
                    chart_data.datasets[j].backgroundColor.splice(0, cut);
                }
            }
            else {
                // assign preliminary data structure
                chart_data.datasets[j] = {
                    data: [],
                    backgroundColor: [],
                };
            }

            // legend entry for subgroups
            chart_data.datasets[j].label = ybin.label;
            BtoJ[ybin.label] = j;
        });

        // update legends and tooltips
        if (model.modelType == 'piechart' || model.modelType == 'polarareachart' ) {
            this._config.options.legend.display = true;
            this._config.options.tooltips.mode = 'single';
        }
        if (model.modelType == 'barchart' || model.modelType == 'radarchart') {
            if(ybins.length == 1) {
                this._config.options.tooltips.mode = 'single';
                this._config.options.legend.display = false;
            }
            else {
                this._config.options.tooltips.mode = 'label';
                this._config.options.legend.display = true;
            }
        }

        // add datapoints
        groups.forEach(function(group){
            // index of A in ybins -> j 
            // index of B in xbins -> i
            var i = AtoI[ group.A ];
            var j = BtoJ[ group.B ];

            var color;
            if (util.isSelected(model, group.A)) {
                if (model.modelType == 'piechart')  {
                    color = colors.get(i);
                }
                else if (model.modelType == 'barchart' ) {
                    color = colors.get(j);
                }
                else if (model.modelType == 'radarchart' ) {
                    color = colors.get(i);
                }
                else if (model.modelType == 'polarareachart' ) {
                    color = colors.get(i);
                }
                else {
                    color = colors.get(j);
                }
            }
            else {
                color = chroma('#aaaaaa');
            }

            chart_data.datasets[j].data[i] = group.C;
            chart_data.datasets[j].backgroundColor[i] = color.hex();
        });
        this._chartjs.update();
    },
});
