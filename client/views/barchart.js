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
            type:'bar',
            data: {
                datasets: [],
                labels: []
            },
            options: {
                responsive: true,
                onClick: this.clicked,
                tooltips: {
                    mode: 'label',
                },
                scales: {
                    xAxes: [{
                        stacked: 'true',
                    }],
                    yAxes: [{
                        stacked: 'true',
                        ticks: {
                            suggestedMin: 0, // start at zero unless there are negative values
                        },
                    }],
                },
            },
        };

        // Create and add to plot
        var ctx = this.queryByHook('chart-area').getContext("2d");
        var myBarChart = new Chart(ctx, this._config);
        myBarChart._Ampersandview = this;

        this._chartjs = myBarChart;
    },
    clicked: function(ev,elements) {  // this -> chartjs chart
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

        // data.labels 
        // data.datasets[n].label 
        // data.datasets[n].data
        // data.datasets[n].backgroundColor

        var model = this.model;
        var data = this._config.data;
        var groups = model._crossfilter.data();

        // labels along the xAxes
        data.labels.splice(0,groups.length);
        groups.forEach(function (g,i) {
            data.labels[i] = g.key;
        });

        // for filtering later on
        var selection = model.selection;

        var subgroups = Object.keys(groups[0].values);
        subgroups.forEach(function(subgroup,i) {

            // prepare data structure
            // reuse as much of the previous data arrays as possible to prevent massive animations on every update
            if(data.datasets[i]) {
                data.datasets[i].data.splice(0,groups.length);
                data.datasets[i].backgroundColor.splice(0,groups.length);
            }
            else {
                data.datasets[i] = {
                    data: [],
                    backgroundColor: [],
                };
            }

            // legend entry for subgroups
            data.datasets[i].label = subgroup;

            // data for subgroup
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
