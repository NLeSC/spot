var widgetModel = require('./widget');
var util = require('../util');

module.exports = widgetModel.extend({
    props: {
        _has_secondary: ['boolean', true, true],
        range: {
            type: 'array',
            required: true,
            default: function () {return [];},
        }
    },
    initFilter: function () {
        this._crossfilter = util.dxGlue2d(this.primary, this.secondary);
    },

    // Set a filter
    setFilter: function () {

        if(this._crossfilter) {
            var dimension = this._crossfilter.dimension;
            var range = this.range;
            var fa, fb;

            dimension.filter(null);
            if (range.length > 0) {
                if (this.primary.displayCategorial) {
                    fa = util.filter1dCategorial();
                }
                else if (this.primary.displayContinuous) {
                    fa = util.filter1dContinuous(this.range[0]);
                }
                if (this.secondary.displayCategorial) {
                    fb = util.filter1dCategorial();
                }
                else if (this.secondary.displayContinuous) {
                    fb = util.filter1dContinuous(this.range[1]);
                }

                dimension.filterFunction(function (d) {
                    return (fa(d[0]) && fb(d[1]));
                });
            }
        }
    },
});
