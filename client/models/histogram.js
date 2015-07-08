// var AmpersandModel = require('ampersand-model');
var widgetModel = require('./widget');

module.exports = widgetModel.extend({
    props: {
        filter: ['any',false], 
        missing: ['number', false],
        chart: ['any', false ],
        filtermin: ['number', false],
        filtermax: ['number', false],
    }
});
