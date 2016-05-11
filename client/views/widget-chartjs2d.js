var app = require('ampersand-app');
var ContentView = require('./widget-content');
var templates = require('../templates');
var Chart = require('chart.js');
var misval = require('../misval');

        var randomColor = function(opacity) {
            return 'rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + (opacity || '.3') + ')';
        };




module.exports = ContentView.extend({
    template: templates.includes.widgetcontent,
    renderContent: function() {
        // tear down existing stuff
        delete this._chartjs;
        delete this._config;

        this._config = this.model.chartjs_config();

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
    update: function() {
        var model = this.model;
        var chart_data = this._config.data;

        var xbins = model.primary.bins;
        var ybins = model.secondary.bins;

        var AtoI = {};
        var BtoJ = {};

        // remove excess points
        var cut = chart_data.datasets.length - xbins.length * ybins.length ;
        if(cut > 0) {
            chart_data.datasets.splice(0,cut);
        }

        // create lookup hashes 
        xbins.forEach(function(xbin,i) {
            AtoI[xbin.label] = i;
        });
        ybins.forEach(function(ybin,j) {
            BtoJ[ybin.label] = j;
        });

        // zero previous data
        xbins.forEach(function(xbin,i) {
            ybins.forEach(function(ybin,j) {
                var d = i + j * xbins.length;

                chart_data.datasets[d] = chart_data.datasets[d] || {};
                chart_data.datasets[d].radius = 0;
                chart_data.datasets[d].hoverRadius = 0;
                chart_data.datasets[d].data = chart_data.datasets[d].data || [{}];
                chart_data.datasets[d].data[0].x = xbin.value;
                chart_data.datasets[d].data[0].y = ybin.value;
            })
        });

        // add data
        model.data.forEach(function(group){
            var i = AtoI[group.a];
            var j = BtoJ[group.b];
            var d = i + j * xbins.length;

            if (group.a != misval && group.b != misval && group.c && group.c != misval) {
                chart_data.datasets[d].radius = parseInt(group.c);
                chart_data.datasets[d].hoverRadius = parseInt(group.c);
            }
        });

        this._chartjs.update();
    },
});
