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
            util.filter1dCategorial(this);

            if(this.collection) {
                this.collection.trigger('filtered');
            }
        }
    },
    updateFilter: function (clickedGroup) {
        util.filter1dCategorialHandler(this.selection, clickedGroup, this.primary.categories);
    },

    chartjs_config: function () {
        return {
            type:'polarArea',
            data: {
                datasets: [],
                labels: []
            },
            options: {
                responsive: true,
                tooltips: {
                },
            }
        };
    },
});
