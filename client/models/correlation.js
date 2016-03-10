var widgetModel = require('./widget');
var util = require('../util');

module.exports = widgetModel.extend({
    props: {
        _has_secondary: ['boolean', true, true],
        _has_tertiary: ['boolean', true, true],
        color: ['string',true, ""],
        alfa: ['number', true, 0],
        beta: ['number', true, 0],
        R2:   ['number', true, 0],
        vary: ['number', true, 1],
        count: ['number', true, 2],
        mode: ['string',true,'fit'],
    },
    initFilter() {
        this._crossfilter = util.dxGlue2d(this.primary, this.secondary, this.tertiary);
        this.mode = 'fit';
    },
    derived: {
        pretty_mode: {
            deps: ['mode'],
            fn: function () {
                if(this.mode == 'fit')    return "Calculate regression";
                if(this.mode == 'drop')   return "Drop outliers";
                if(this.mode == 'select') return "Select outliers";
            }
        },
        pretty_fit: {
            deps: ['alfa', 'beta', 'primary', 'secondary', 'R2'],
            fn: function () {
                if (this.primary && this.secondary) {
                    return this.secondary.name + '=' + 
                           this.alfa.toFixed(2) + " + " +
                           this.beta.toFixed(2) + " * " +
                           this.primary.name + ";  R2 = " +
                           this.R2.toFixed(2);
                }
                else {
                    return "y = a * x + b";
                }
            }
        },
        cutoff: {
            deps: ['vary','count','R2'],
            fn: function () {
                return Math.sqrt((1-this.R2)*this.vary) * this.count;
            }
        }
    },
});
