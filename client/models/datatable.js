var widgetModel = require('./widget');

module.exports = widgetModel.extend({
    props: {
        count: ['number', true, 10],
        order: ['string', true, 'descending'],
    },
});
