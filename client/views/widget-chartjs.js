var app = require('ampersand-app');
var ContentView = require('./widget-content');
var templates = require('../templates');
var Chart = require('chart.js');
var filters = require('../filters');
var colors = require('../colors');
var chroma = require('chroma-js');

module.exports = ContentView.extend({
    template: templates.includes.widgetcontent,
    renderContent: function() {
        // tear down existing stuff
        delete this._chartjs;
        delete this._config;

        this._config = this.model.chartjs_config();
        if (this.model.modelType != 'linechart' && this.model.modelType != 'radarchart') {
            this._config.options.onClick = this.clicked;
        }

        // Create and add to plot
        var ctx = this.queryByHook('chart-area').getContext("2d");
        var myChart = new Chart(ctx, this._config);

        // link chart and view
        myChart._Ampersandview = this;
        this._chartjs = myChart;

        // redraw when the widgets indicates new data is available
        this.model.on('newdata', function () {
            this.update();
        }, this);

        this.model.setFilter();
    },
    clicked: function(ev,elements){    // this -> chart
        var that = this._Ampersandview.model;
        var xbins = this._Ampersandview._xbins;

        if(elements.length > 0) {
            // var clickedGroup = elements[0]._chart.config.data.labels[elements[0]._index];
            var clickedBin = xbins[elements[0]._index];
            that.updateFilter.call(that,clickedBin.group);
        }
        else {
            that.selection = [];
            that.setFilter();
        }
    },
    update: function() {
        var model = this.model;

        var chart_data = this._config.data;
        var groups = model.data;

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
            var color = [];

            if(chart_data.datasets[j]) {
                // match the existing number of groups to the updated number of groups
                var cut = chart_data.datasets[j].data.length - xbins.length;
                if (cut > 0) {
                    chart_data.datasets[j].data.splice(0, cut);
                    chart_data.datasets[j].color.splice(0, cut);
                }
                // clear out old data
                for(i=0;i<xbins.length;i++) {
                    chart_data.datasets[j].data[i] = 0;
                }
            }
            else {
                // assign preliminary data structure

                chart_data.datasets[j] = {
                    data: [],
                    color: color,
                    fillcolor: color,
                    backgroundColor: color,
                };
            }

            // legend entry for subgroups
            chart_data.datasets[j].label = ybin.label;
            BtoJ[ybin.label] = j;

            if (model.modelType == 'radarchart' || model.modelType == 'linechart') {
                color = colors.get(j).alpha(0.75);
                chart_data.datasets[j].color = color.css();
                chart_data.datasets[j].fillcolor = color.alpha(0.5).css();
                chart_data.datasets[j].backgroundColor = color.css();
            }

        });

        // update legends and tooltips
        this._config.options.legend.display = true;
        this._config.options.tooltips.mode = 'single';
        if (model.modelType == 'barchart' || model.modelType == 'radarchart' || model.modelType == 'linechart' ) {
            if(ybins.length == 1) {
                this._config.options.legend.display = false;
                this._config.options.tooltips.mode = 'single';
            }
            else {
                this._config.options.legend.display = true;
                this._config.options.tooltips.mode = 'label';
            }
        }

        // add datapoints
        groups.forEach(function(group){
            if(AtoI.hasOwnProperty(group.a) && BtoJ.hasOwnProperty(group.b)) {
                // index of A in ybins -> j 
                // index of B in xbins -> i
                var i = AtoI[ group.a ];
                var j = BtoJ[ group.b ];

                var color;
                if (filters.isSelected(model, xbins[i].value)) {
                    if (model.modelType == 'piechart' || model.modelType == 'polarareachart')  {
                        color = colors.get(i);
                        chart_data.datasets[j].color[i] = color.hex();
                    }
                    else if (model.modelType == 'barchart' || model.modelType == 'radarchart' || model.modelType == 'linechart' ) {
                        color = colors.get(j);
                        chart_data.datasets[j].color[i] = color.css();
                    }
                }
                else {
                    color = chroma('#aaaaaa');
                    if (model.modelType == 'piechart' || model.modelType == 'polarareachart')  {
                        chart_data.datasets[j].color[i] = color.css();
                    }
                    else if (model.modelType == 'barchart' || model.modelType == 'radarchart' || model.modelType == 'linechart') {
                        chart_data.datasets[j].color[i] = color.css();
                    }
                }

                chart_data.datasets[j].data[i] = parseFloat(group.c);
            }
        });
        this._chartjs.update();
        this._xbins = xbins // keep a reference to resolve mouseclicks
    },
});
