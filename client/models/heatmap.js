var widgetModel = require('./widget');

module.exports = widgetModel.extend({
    props: {
        min: ['number', false],
        max: ['number', false],
        total: ['number', false],
        alpha: ['number', true, 100],
        filter: ['any',false], 
    }
});

