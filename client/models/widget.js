var AmpersandModel = require('ampersand-model');

module.exports = AmpersandModel.extend({
    props: {
        type: 'string',
        title: ['string',true,""],

        _has_primary: ['boolean', true, true],
        primary: ['state',false,null],

        _has_secondary: ['boolean', true, false],
        secondary: ['state',false,null],

        _has_tertiary: ['boolean', true, false],
        tertiary: ['state',false,null],
    },

    // unique identifiers to hook up the mdl javascript
    derived: {
        _title_id:     { deps: ['cid'], cache: true, fn: function () { return this.cid + '_title'; } },
    }
});
