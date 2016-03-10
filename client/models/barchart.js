var widgetModel = require('./widget');
var util = require('../util');

module.exports = widgetModel.extend({
    props: {
        _has_secondary: ['boolean', true, true],
        _has_tertiary: ['boolean', true, true],
        range: ['any', false],
    },
    initFilter: function () {
        // Stacked barchart
        if(this.secondary && this.secondary.displayCategorial) {
            this._crossfilter = util.dxGlueAbyCatB(this.primary, this.secondary, this.tertiary);
        }
        // Regular barchart, if secondary is falsy
        // Else, group by facetA, take value of facetB
        else {
            this._crossfilter = util.dxGlue1d(this.primary, this.secondary);
        }
    },
});
