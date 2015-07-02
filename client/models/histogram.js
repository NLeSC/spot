var AmpersandModel = require('ampersand-model');

module.exports = AmpersandModel.extend({
    props: {
        filter: ['any',false], 
        missing: ['number', false],
        chart: ['any', false ],
        filtermin: ['number', false],
        filtermax: ['number', false],
    }
});
