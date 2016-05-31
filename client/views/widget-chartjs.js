var app = require('ampersand-app');
var ContentView = require('./widget-content');
var templates = require('../templates');
var Chart = require('chart.js');
var filters = require('../filters');
var colors = require('../colors');
var chroma = require('chroma-js');

var destroyChart = function destroyChart(view) {
    // tear down existing stuff
    if (view._chartjs) {
        view._chartjs.destroy();
        delete view._chartjs;
    }
    delete view._config;
};

var initChart = function initChart(view) {
    var model = view.model;

    // Configure plot
    view._config = model.chartjs_config();
    var options = view._config.options;

    // axis types
    if (model.getType() == 'barchart' || model.getType() == 'linechart') {
        var valueFacet = model.tertiary || model.secondary || model.primary;
        if (valueFacet) {
            if (valueFacet.groupLog || valueFacet.transformExceedances) {
                options.scales.yAxes[0].type = 'logarithmic';
                options.scales.yAxes[0].stacked = false;
            }
            else {
                options.scales.yAxes[0].type = 'linear';
            }
        }
    }

    // mouse selection callbacks
    if (model.getType() != 'linechart' && model.getType() != 'radarchart') {
        options.onClick = onClick;
    }

    // Create Chartjs object
    view._chartjs = new Chart(view.queryByHook('chart-area').getContext("2d"), view._config);

    // In callbacks on the chart we will need the view, so store a reference
    view._chartjs._Ampersandview = view;
};

// Called by Chartjs, this -> chart instance
var onClick = function onClick(ev, elements) {
    var that = this._Ampersandview.model;
    var xbins = this._Ampersandview._xbins;

    if(elements.length > 0) {
        var clickedBin = xbins[elements[0]._index];
        that.updateFilter.call(that,clickedBin.group);
    }
    else {
        that.selection = [];
        that.setFilter();
    }
};

module.exports = ContentView.extend({
    template: templates.includes.widgetcontent,
    renderContent: function() {

        // add a default chart to the view
        initChart(this);

        // redraw when the widgets indicates new data is available
        this.model.on('newdata', function () {
            this.update();
        }, this);

        // reset the plot when the facets change
        this.model.on('updatefacets', function () {
            destroyChart(this);
            initChart(this);
            if(this.model.getType != 'piechart') {
                this.update();
            }
        }, this);

        this.model.setFilter();
    },
    update: function() {
        var model = this.model;
        var chart_data = this._config.data;

        var AtoI = {};
        var BtoJ = {};

        // prepare data structure, reuse as much of the previous data arrays as possible
        // to prevent massive animations on every update

        // labels along the xAxes, keep a reference to resolve mouseclicks
        var xbins = this.model.primary.bins;
        this._xbins = xbins ;

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
        ybins.forEach(function(ybin,j) { // for each subgroup...

            // Update or assign data structure:
            // data  Array
            // color depending on plot type:
            //           Array<Color>: barchart, polarareachart, piechart
            //           Color:        linechart, radarchart
            chart_data.datasets[j] = chart_data.datasets[j] || {data:[]};

            // match the existing number of groups to the updated number of groups
            var cut = chart_data.datasets[j].data.length - xbins.length;
            if (cut > 0) {
                chart_data.datasets[j].data.splice(0, cut);
            }
            
            if (model.getType() == 'barchart' || model.getType() == 'polarareachart' || model.getType() == 'piechart') {
                if(chart_data.datasets[j].backgroundColor instanceof Array) {
                    if(cut > 0) {
                        chart_data.datasets[j].backgroundColor.splice(0, cut);
                    }
                }
                else {
                    chart_data.datasets[j].backgroundColor = [];
                }
            }
            else {
                chart_data.datasets[j].backgroundColor = colors.get(j).alpha(0.75).css();
            }

            // clear out old data
            for(i=0;i<xbins.length;i++) {
                chart_data.datasets[j].data[i] = 0;
            }

            // add a legend entry
            chart_data.datasets[j].label = ybin.label;
            BtoJ[ybin.label] = j;
        });

        // update legends and tooltips
        this._config.options.legend.display = true;
        this._config.options.tooltips.mode = 'single';
        if (model.getType() == 'barchart' || model.getType() == 'radarchart' || model.getType() == 'linechart' ) {
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
        model.data.forEach(function(group){
            if(AtoI.hasOwnProperty(group.a) && BtoJ.hasOwnProperty(group.b)) {
                var i = AtoI[group.a];
                var j = BtoJ[group.b];

                if (filters.isSelected(model, xbins[i].value)) {
                    if (model.getType() == 'piechart' || model.getType() == 'polarareachart')  {
                        chart_data.datasets[j].backgroundColor[i] = colors.get(i).css();
                    }
                    else if (model.getType() == 'barchart') {
                        chart_data.datasets[j].backgroundColor[i] = colors.get(j).css();
                    }
                }
                else {
                    if (model.getType() == 'barchart' || model.getType() == 'piechart' || model.getType() == 'polarareachart')  {
                        chart_data.datasets[j].backgroundColor[i] = chroma('#aaaaaa').css();
                    }
                }

                chart_data.datasets[j].data[i] = parseFloat(group.c) || 0;
            }
        });


        // Logarithmic plots

        // prevent zero values in logarithmic plots, map them to 10% of the lowest value in the plot
        var valueFacet = model.tertiary || model.secondary || model.primary;
        var minval = Number.MAX_VALUE;

        if (valueFacet && (valueFacet.groupLog || valueFacet.transformExceedances)) {

            // find smallest value with a defined logarithm
            chart_data.datasets.forEach(function(dataset,j) {
                dataset.data.forEach(function(value,i) {
                    if (value < minval && value > 0) {
                        minval = value;
                    }
                });
            });

            if (minval == Number.MAX_VALUE) minval = 1;

            // Set logarithmic scale for the charts that use it
            if (model.getType() == 'barchart' || model.getType() == 'linechart') {
                this._config.options.scales.yAxes[0].ticks.min = minval * 0.5;
            }

            chart_data.datasets.forEach(function(dataset,j) {
                dataset.data.forEach(function(value,i) {
                    // update values for logarithmic scales
                    if (model.getType() == 'barchart' || model.getType() == 'linechart') {
                        if (value < minval) {
                            chart_data.datasets[j].data[i] = minval * 0.1;
                        }
                    }
                    // fake a logarithmic scale by taking a logarithm ourselves.
                    else {
                        if (value < minval) {
                            chart_data.datasets[j].data[i] = 0;
                        }
                        else {
                            chart_data.datasets[j].data[i] = Math.log(chart_data.datasets[j].data[i])/Math.log(10.0);
                        }
                    }
                });
            });
        }


        // Hand-off to ChartJS for plotting
        this._chartjs.update();
    },
});
