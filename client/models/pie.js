var widgetModel = require('./widget');

module.exports = widgetModel.extend({
    props: {
        missing: ['number', false],
    }
});
