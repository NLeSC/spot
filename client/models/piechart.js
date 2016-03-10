var widgetModel = require('./widget');
var util = require('../util');

module.exports = widgetModel.extend({
    props: {
        _has_secondary: ['boolean', true, true],
        selection: ['any', false],
    },
    initFilter: function () {
        if(this.secondary && this.secondary.displayContinuous) {
            this._crossfilter = util.dxGlue1d(this.primary,this.secondary);
        }
        else {
            this._crossfilter = util.dxGlue1d(this.primary,null);
        }
    },
});
