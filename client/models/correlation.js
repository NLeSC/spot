var widgetModel = require('./widget');

module.exports = widgetModel.extend({
    props: {
        min: ['number', false],
        max: ['number', false],
        total: ['number', false],
        alpha: ['number', true, 100],
        secondary: ['string',true,""], 
        color: ['string',true, ""],
    },
    derived: {
        isReady: {
            deps: ['filter','secondary'],
            fn: function () {
                if(this.filter.length > 0 && this.secondary.length > 0) {
                    return true;
                }
                return false;
            },
        },
    },
});
