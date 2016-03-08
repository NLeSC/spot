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
    }
});
