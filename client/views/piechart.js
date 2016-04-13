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
        var primary = that.model.primary;

        if(elements.length > 0) {
            if(primary.displayCategorial) {
                util.filter1dCategorialHandler(that.model.selection, elements[0]._view.label, primary.categories);
            }
            else if (primary.displayContinuous) {
                util.filter1dContinuousHandler(that.model.selection, elements[0]._view.label, [primary.minval, primary.maxval]);
            }
            that.model.setFilter();
        }
        else {
            // FIXME: a mouse click fires mulitple events, find out how to get only the relevant one 
            // that.model.selection = [];
        }
    },
    update: function() {
        if(! this._chartjs) {
            this.renderContent();
        }
        if(! this.model._crossfilter) {
            this.model.initFilter();
        }

        // var colors = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];
        // data.labels
        // data.datasets[n].label
        // data.datasets[n].data
        // data.datasets[n].backgroundColor

        var model = this.model;
        var data = this._config.data;
        var groups = model._crossfilter.data();
        var cut;

        // labels along the xAxes
        data.labels.splice(0,groups.length);
        groups.forEach(function (g,i) {
            data.labels[i] = g.key;
        });

        // for filtering later on
        var selection = model.selection;

        if(data.datasets) {
            // match the existing number of groups to the updated number of groups
            data.datasets.length - subgroups.length;
            if(cut > 0) {
                data.datasets.splice(0, cut);
            }
        }

        var subgroups = Object.keys(groups[0].values);
        subgroups.forEach(function(subgroup,i) {

            // prepare data structure, reuse as much of the previous data arrays as possible
            // to prevent massive animations on every update

            if(data.datasets[i]) {
                // match the existing number of groups to the updated number of groups
                cut = data.datasets[i].length - groups.length;
                if (cut > 0) {
                    data.datasets[i].data.splice(0, cut);
                    data.datasets[i].backgroundColor.splice(0, cut);
                }
            }
            else {
                data.datasets[i] = {
                    data: [],
                    backgroundColor: [],
                };
            }

            // legend entry for subgroups
            data.datasets[i].label = subgroup;

            // data and color for subgroup
            groups.forEach(function(group,j) {
                var color;
                if (util.isSelected(model, group.key)) {
                    color = chroma('#8dd3c7');
                }
                else {
                    color = chroma('#aaaaaa');
                }
                data.datasets[i].data[j] = group.values[subgroup];
                data.datasets[i].backgroundColor[j] = color.hex();
            });
        });

        this._chartjs.update();
    },
});
