var Widget = require('./widget');
var Facet = require('./facet');

var filters = require('../filters');
var util = require('../util');

module.exports = Widget.extend({

    session: {
        _crossfilter: ['any',false,null]
    },

    initialize: function () {
        this.on('remove', function () {
            this.releaseFilter();
        });
    },

    // Initialize a filter
    // Needed for stateful dataservers like crossfilter
    initFilter: function () {
        var A = this.primary;
        var B = this.secondary;
        var C = this.tertiary;

        if (! A) A = util.unitFacet;
        if (! C) C = B;
        if (! C) C = A;
        if (! B) B = util.unitFacet;

        if(this.primary) {
            this._crossfilter = util.dxInit(A,B,C);
            return true;
        }
        return false;
    },

    // Free a filter
    // Called on destruct / remove events
    // Defaults to cleaning up after crossfilter backed widgets
    releaseFilter: function () {
        // Free _crossfilter internal state
        if (this._crossfilter) {
            this._crossfilter.dimension.filterAll();
            this._crossfilter.dimension.dispose();

            this._crossfilter = null;
            this.range = [];
        }
    },

    // Remove the filter, but do not release any filters or state
    // Useful for when you want to peek at the full dataset,
    // or to stop filtering from off-screen widgets
    pauseFilter: function () {
        if (this._crossfilter) {
            this._crossfilter.dimension.filterAll();
        }
    },

    // Set the proper filter handlers
    updateFilter: function (group) {
        if(this.primary.displayCategorial) {
            filters.categorial1DHandler(this.selection, group, this.primary.categories);
        }
        else if (this.primary.displayContinuous) {
            filters.continuous1DHandler(this.selection, group, [this.primary.minval, this.primary.maxval]);
        }
    },

    // Set a filter
    setFilter: function () {
        if(this._crossfilter) {
            var selection = this.selection;

            if (this.primary.displayCategorial) {
                filters.categorial1D(this);
            }
            else if (this.primary.displayContinuous) {
                filters.continuous1D(this);
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
