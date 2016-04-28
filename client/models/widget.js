var AmpersandModel = require('ampersand-model');
var Facet = require('./facet');
var filters = require('../filters');
var util = require('../util');

module.exports = AmpersandModel.extend({
    dataTypes: {
        // define the 'facet' datatype to let ampersand do the (de)serializing
        facet : {
            set: function (newval) {
                // allow a facet to be null
                if(newval === null) {
                    return {type: 'facet', val: null};
                }
                // set it from another facet
                if(newval && newval.modelType && newval.getType() == 'facet') {
                    return {type:'facet', val: newval};
                }
                // set it from a JSON object
                try {
                    newval = new Facet(newval);
                    return {type: 'facet', val: newval};
                }
                catch (parseError) {
                    return {type: typeof newval, val: newval};
                } 
            },
            compare: function (currentVal, newVal, attributeName) {
                try {
                    return currentVal.cid == newVal.cid;
                }
                catch (anyError) {
                    return false;
                }
            },
            onChange: function (value, previousValue, attributeName) {
                if(attributeName == 'primary' || attributeName == 'secondary' || attributeName == 'tertiary') {
                    this.releaseFilter();
                }
            },
        },
    },
    props: {
        modelType: ['string',true,'basewidget'],
        title: ['string',true,""],

        _has_primary: ['boolean', true, true],
        primary: ['facet',false,null],

        _has_secondary: ['boolean', true, false],
        secondary: ['facet',false,null],

        _has_tertiary: ['boolean', true, false],
        tertiary: ['facet',false,null],
    },

    // unique identifiers to hook up the mdl javascript
    derived: {
        _title_id:     { deps: ['cid'], cache: true, fn: function () { return this.cid + '_title'; } },
    },

    // Initialize the widget: set up callback to free internal state on remove
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
            var dataset = this.primary.collection;

            this._datasetHandle = dataset.initFilter(A,B,C);
            this._datasetHandle.widget = this;
            return true;
        }
        return false;
    },

    // Free a filter
    // Called on destruct / remove events
    releaseFilter: function () {
        if (this._datasetHandle) {
            var dataset = this.primary.collection;

            // Free _datasetHandle internal state
            dataset.releaseFilter(this._datasetHandle);
            this.selection = [];
            this._datasetHandle = null;
        }
    },

    // Adjust the filter for the group
    // ie. add / remove etc.
    updateFilter: function (group) {
        if(this.primary.displayCategorial) {
            filters.categorial1DHandler(this.selection, group, this.primary.categories);
        }
        else if (this.primary.displayContinuous) {
            var options = {};
            options.log = this.primary.groupLog;
            filters.continuous1DHandler(this.selection, group, [this.primary.minval, this.primary.maxval], options);
        }
        this.setFilter();
    },

    // Remove the filter, but do not release any filters or state
    // Useful for when you want to peek at the full dataset,
    // or to stop filtering from off-screen widgets
    pauseFilter: function () {
        console.warn("pauseFilter not implemented for widget", this);
    },

    // Set a filter
    setFilter: function () {
        if(this._datasetHandle) {
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

            var dataset = this.primary.collection;
            dataset.setFilter(this._datasetHandle);

            if(this.collection) {
                this.collection.trigger('filtered');
            }
        }
    }, 

});
