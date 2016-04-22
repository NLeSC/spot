var AmpersandModel = require('ampersand-model');
var Facet = require('./facet');

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

    // Initialize a filter
    // Needed for stateful dataservers like crossfilter
    initFilter: function () {
        console.warn("initFilter not implemented for widget", this);
    },

    // Free a filter
    // Called on destruct / remove events
    releaseFilter: function () {
        console.warn("releaseFilter not implemented for widget", this);
    },

    // Adjust the filter for the group
    // ie. add / remove etc.
    updateFilter: function (group) {
        console.warn("updateFilter not implemented for widget", this);
    },

    // Remove the filter, but do not release any filters or state
    // Useful for when you want to peek at the full dataset,
    // or to stop filtering from off-screen widgets
    pauseFilter: function () {
        console.warn("pauseFilter not implemented for widget", this);
    },

    // Set a filter
    setFilter: function () {
        console.warn("setFilter not implemented for widget", this);
    }, 

});
