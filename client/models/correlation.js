var widgetModel = require('./widget');

module.exports = widgetModel.extend({
    props: {
        secondary: ['string',true,""], 
        color: ['string',true, ""],
        alfa: ['number', true, 0],
        beta: ['number', true, 0],
        R2:   ['number', true, 0],
        count: ['number', true, 2],
        inout: ['string',true,'in'],        
        mode: ['string',true,'fit'],
    },
    derived: {
        isReady: {
            deps: ['filter','secondary'],
            fn: function () {
                if(this.filter.length > 0 && this.filter != 'Chose a filter' &&
                   this.secondary.length > 0 && this.secondary != 'Chose a filter') {
                    return true;
                }
                return false;
            },
        },
        pretty_fit: {
            deps: ['alfa', 'beta', 'filter', 'secondary', 'R2', 'isReady'],
            fn: function () {
                if (this.isReady) {
                    return this.secondary + '=' + 
                           this.alfa.toFixed(2) + " + " +
                           this.beta.toFixed(2) + " * " +
                           this.filter + "  R2 = " +
                           this.R2.toFixed(2);
                }
                else {
                    return "Select filters";
                }
            }
        },
    },
});
