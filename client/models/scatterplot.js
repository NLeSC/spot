var widgetModel = require('./widget');

module.exports = widgetModel.extend({
    props: {
        _has_secondary: ['boolean', true, true],
        range: ['any', false],
    },
    derived: {
        isReady: {
            deps: ['primary','secondary'],
            fn: function () {
                if(this.primary && this.secondary) {
                    return true;
                }
                return false;
            }
        },
    },
});
