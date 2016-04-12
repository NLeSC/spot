var widgetModel = require('./widget');
var util = require('../util');

module.exports = widgetModel.extend({
    props: {
        _has_secondary: ['boolean', true, true],
        _has_tertiary: ['boolean', true, true],
        range: {
            type: 'array',
            required: true,
            default: function () {return [];},
        }
    },
    initFilter: function () {
        this._crossfilter = util.dxGlueAbyCatB(this.primary, this.secondary, this.tertiary);
    },

    // Set a filter
    setFilter: function () {

        if(this._crossfilter) {
            var range = this.range;

            if (this.primary.displayCategorial) {
                util.filter1dCategorial(this);
            }
            else if (this.primary.displayContinuous) {
                util.filter1dContinuous(this);
            }
            else {
                console.warn("Can not apply filter for facet", facet);
            }

            if(this.collection) {
                this.collection.trigger('filtered');
            }
        }
    },
});
