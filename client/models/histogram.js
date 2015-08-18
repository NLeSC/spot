var widgetModel = require('./widget');

module.exports = widgetModel.extend({
    props: {
        filtermin: ['number', false],
        filtermax: ['number', false],
    }
});
