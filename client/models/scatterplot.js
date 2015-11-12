var widgetModel = require('./widget');

module.exports = widgetModel.extend({
    props: {
        _has_secondary: ['boolean', true, true],
        bincount: ['number',true,20],
        range: ['any', false],
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
            }
        },
    },
});
