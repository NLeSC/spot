var widgetModel = require('./widget');

module.exports = widgetModel.extend({
    props: {
        secondary: ['string',true,""], 
        bincount: ['number',true,20],
        range: ['any', false],
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
            }
        },
    },
});
