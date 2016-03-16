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

    console.log(this.range);
        if(this._crossfilter) {
            var dimension = this._crossfilter.dimension;
            var range = this.range;

            dimension.filter(null);
            if (range.length > 0) {
                if (this.primary.displayCategorial) {
                    dimension.filterFunction(function (d) {
                        if(d == util.misval) return false;

                        var i;
                        for (i=0; i<range.length; i++) {
                            if(range[i] == d) {
                                return true;
                            }
                        }
                        return false;
                    });
                }
                else if (this.primary.displayContinuous) {

                    var min = range[0][0];
                    var max = range[0][1];
                    if(min > max) {
                        min = max;
                        max = range[0][0];
                    }
                        
                    dimension.filterFunction(function (d) {
                        return (d >= min && d < max && d != util.misval);
                    });
                }
            }
        }
    },
});
