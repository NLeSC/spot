var widgetModel = require('./widget');
var util = require('../util');

module.exports = widgetModel.extend({
    props: {
        _has_secondary: ['boolean', true, true],
        selection: {
            type: 'array',
            required: true,
            default: function () {return [];},
        }
    },
    initFilter: function () {
        if(this.secondary && this.secondary.displayContinuous) {
            this._crossfilter = util.dxGlue1d(this.primary,this.secondary);
        }
        else {
            this._crossfilter = util.dxGlue1d(this.primary,null);
        }
    },

    // Set a filter
    setFilter: function () {

        if(this._crossfilter) {
            var dimension = this._crossfilter.dimension;
            var selection = this.selection;

            dimension.filter(null);
            if (selection.length > 0) {
                dimension.filterFunction(function (d) {
                    var i;
                    for (i=0; i<selection.length; i++) {
                        if(selection[i] == d) {
                            return true;
                        }
                    }
                    return false;
                });
            }
        }
    },

});
