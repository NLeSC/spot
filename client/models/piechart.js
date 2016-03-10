var widgetModel = require('./widget');

module.exports = widgetModel.extend({
    props: {
        _has_secondary: ['boolean', true, true],
        selection: ['any', false],
    }
});
