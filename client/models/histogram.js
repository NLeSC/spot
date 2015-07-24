var widgetModel = require('./widget');

module.exports = widgetModel.extend({
    props: {
        missing: ['number', false],
        filtermin: ['number', false],
        filtermax: ['number', false],
    }
});
