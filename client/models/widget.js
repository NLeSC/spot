var AmpersandModel = require('ampersand-model');
var Facet = require('./facet');
var SqlFacet = require('./facet-sql');
var CrossfilterFacet = require('./facet-crossfilter');
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
                if(newval && (
                    newval instanceof Facet ||
                    newval instanceof CrossfilterFacet ||
                    newval instanceof SqlFacet)) {
                    return {type:'facet', val: newval};
                }
                // set it from a JSON object
                try {
                    if (newval.modelType == 'crossfilter' ) {
                        newval = new CrossfilterFacet(newval);
                    }
                    else if (newval.modelType == 'sql' ) {
                        newval = new SqlFacet(newval);
                    }
                    else if (newval.modelType == 'generic' ) {
                        newval = new Facet(newval);
                    }
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
        },
    },
    props: {
        modelType: ['string',true,'basewidget'],
        id: {
            type: 'number',
            default: function () {return util.newId();},
            setonce: true,
        },
        title: ['string',true,""],

        _has_primary: ['boolean', true, true],
        primary: ['facet',false,null],

        _has_secondary: ['boolean', true, false],
        secondary: ['facet',false,null],

        _has_tertiary: ['boolean', true, false],
        tertiary: ['facet',false,null],

        isFiltered: ['boolean', true, false],
    },

    // unique identifiers to hook up the mdl javascript
    derived: {
        _title_id:     { deps: ['cid'], cache: true, fn: function () { return this.cid + '_title'; } },
    },

    // Session properties are not typically persisted to the server, 
    // and are not returned by calls to toJSON() or serialize().
    session: {
        data: {
            type: 'array',
            default: function () {return [];},
        },
        getData: 'any',
        dimension: 'any',
    },

    // Initialize the widget:
    // * set up callback to free internal state on remove
    // * initialize filters, and get some data
    initialize: function () {
        this.on('remove', function () {
            this.releaseFilter();
        }, this);

        this.on('updatefacets', function () {
            this.releaseFilter();
            this.initFilter();
            this.getData();
        }, this);
    },

    // Initialize a filter
    // Needed for stateful dataservers like crossfilter
    initFilter: function () {
        if(this.primary) {
            var dataset = this.primary.collection;
            dataset.initDataFilter(this);
            this.isFiltered = true;
        }
    },

    // Free a filter
    // Called on destruct / remove events
    releaseFilter: function () {
        if(this.isFiltered) {
            var dataset = this.primary.collection;

            dataset.releaseDataFilter(this);
            this.selection = [];
            this.isFiltered = false;
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
        if (this.isFiltered) {
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
            dataset.setDataFilter(this);

            // Tell all widgets in collection to get new data
            if (this.collection) {
                this.collection.getAllData();
            }
        }
    }, 
});
