var widgetModel = require('./widget');

module.exports = widgetModel.extend({
    props: {
        _has_secondary: ['boolean', true, true],
        _has_tertiary: ['boolean', true, true],
        color: ['string',true, ""],
        alfa: ['number', true, 0],
        beta: ['number', true, 0],
        R2:   ['number', true, 0],
        count: ['number', true, 2],
        mode: ['string',true,'fit'],
    },
    derived: {
        isReady: {
            deps: ['primary','secondary'],
            fn: function () {
                if(this.primary.length > 0 && this.primary != 'Chose a facet' &&
                   this.secondary.length > 0 && this.secondary != 'Chose a facet') {
                    return true;
                }
                return false;
            },
        },
        pretty_mode: {
            deps: ['mode'],
            fn: function () {
                if(this.mode == 'fit')    return "Calculate regression";
                if(this.mode == 'drop')   return "Drop outliers";
                if(this.mode == 'select') return "Select outliers";
            }
        },
        pretty_fit: {
            deps: ['alfa', 'beta', 'primary', 'secondary', 'R2', 'isReady'],
            fn: function () {
                if (this.isReady) {
                    return this.secondary + '=' + 
                           this.alfa.toFixed(2) + " + " +
                           this.beta.toFixed(2) + " * " +
                           this.primary + "  R2 = " +
                           this.R2.toFixed(2);
                }
                else {
                    return "Select facets";
                }
            }
        },
    },
});
