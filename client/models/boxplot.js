var widgetModel = require('./widget');
var util = require('../util');

module.exports = widgetModel.extend({
    props: {
        _has_secondary: ['boolean', true, true],
        range: ['any', false],
    },
    initFilter: function () {
        this._crossfilter = util.dxGlueAwithBs(this.primary, this.secondary);
    },
});
