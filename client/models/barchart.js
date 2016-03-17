var widgetModel = require('./widget');
var util = require('../util');

module.exports = widgetModel.extend({
    props: {
        _has_secondary: ['boolean', true, true],
        _has_tertiary: ['boolean', true, true],
        range: {
            type: 'array',
            required: true,
            default: function () {return [];},
        }
    },
    initFilter: function () {
        // Stacked barchart
        if(this.secondary && this.secondary.displayCategorial) {
            this._crossfilter = util.dxGlueAbyCatB(this.primary, this.secondary, this.tertiary);
        }
        // Regular barchart, if secondary is falsy
        // Else, group by facetA, take value of facetB
        else {
            this._crossfilter = util.dxGlue1d(this.primary, this.secondary);
        }
    },

    // Set a filter
    setFilter: function () {

        if(this._crossfilter) {
            var dimension = this._crossfilter.dimension;
            var range = this.range;

            dimension.filter(null);
            if (range.length > 0) {
                if (this.primary.displayCategorial) {
                    dimension.filterFunction(util.filter1dCategorial(range));
                }
                else if (this.primary.displayContinuous) {
                    dimension.filterFunction(util.filter1dContinuous(range[0]));
                }
            }
        }
    },
});
