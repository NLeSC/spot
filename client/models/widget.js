var AmpersandModel = require('ampersand-model');

module.exports = AmpersandModel.extend({
    props: {
        type: 'string',
        filter: ['any',true,""], 
    }
});
