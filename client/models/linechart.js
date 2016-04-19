var widgetModel = require('./widget');
var util = require('../util');

module.exports = widgetModel.extend({
    props: {
        _has_secondary: ['boolean', true, true],
        _has_tertiary: ['boolean', true, true],
        selection: {
            type: 'array',
            required: true,
            default: function () {return [];},
        }
    },
    initFilter: function () {
        if(this.primary) {
            this._crossfilter = util.dxGlueAbyCatB(this.primary, this.secondary, this.tertiary);
            return true;
        }
        return false;
    },

    // Set a filter
    setFilter: function () {

        if(this._crossfilter) {
            var selection = this.selection;

            if (this.primary.displayCategorial) {
                util.filter1dCategorial(this);
            }
            else if (this.primary.displayContinuous) {
                util.filter1dContinuous(this);
            }
            else {
                console.warn("Can not apply filter for facet", facet);
            }

            if(this.collection) {
                this.collection.trigger('filtered');
            }
        }
    },
    updateFilter: function (clickedGroup) {
        if(this.primary.displayCategorial) {
            util.filter1dCategorialHandler(this.selection, clickedGroup, this.primary.categories);
        }
        else if (this.primary.displayContinuous) {
            util.filter1dContinuousHandler(this.selection, clickedGroup, [this.primary.minval, this.primary.maxval]);
        }
    },

    chartjs_config: function () {
        return {
            type:'line',
            data: {
                datasets: [{data: [], backgroundColor: []}],
                labels: []
            },
            options: {
                responsive: true,
                scales: {
                    xAxes: [{
                        stacked: true,
                    }],
                    yAxes: [{
                        stacked: true,
                    }]
                },
                tooltips: {
                },
                onClick: this.clicked
            }
        };
    },
});
