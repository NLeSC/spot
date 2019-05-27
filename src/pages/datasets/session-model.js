var AmpersandModel = require('ampersand-model');

module.exports = AmpersandModel.extend({
    props: {
        id: 'string',
        date: 'string',
        name: 'string'
    },
    session: {
        isActive: ['boolean', true, false],
    },
    derived: {
        // fullName: {
        //     deps: ['date', 'name'],
        //     fn: function () {
        //         return this.firstName + ' ' + this.lastName;
        //     }
        // }
    }
});