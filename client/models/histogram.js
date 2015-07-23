var widgetModel = require('./widget');

module.exports = widgetModel.extend({
    props: {
        missing: ['number', false],
        chart: ['any', false ],
        filtermin: ['number', false],
        filtermax: ['number', false],
    }
});
