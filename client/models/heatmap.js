var widgetModel = require('./widget');

module.exports = widgetModel.extend({
    props: {
        _has_primary: ['boolean', true, false],
        _has_tertiary: ['boolean', true, true],
        min: ['number', false],
        max: ['number', false],
        total: ['number', false],
        alpha: ['number', true, 100],
    }
});

