var AmpersandModel = require('ampersand-model');

module.exports = AmpersandModel.extend({
    props: {
        type: 'string',

        _has_primary: ['boolean', true, true],
        primary: ['any',true,""], 
        title: ['string',true,""],

        _has_secondary: ['boolean', true, false],
        secondary: ['any',false,""],

        _has_tertiary: ['boolean', true, false],
        tertiary: ['any',false,""],
    },

    // unique identifiers to hook up the mdl javascript
    derived: {
        _title_id:     { deps: ['cid'], cache: true, fn: function () { return this.cid + '_title'; } },
    }
});
