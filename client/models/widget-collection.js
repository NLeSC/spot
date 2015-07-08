var Collection = require('ampersand-collection');
var widgetModel = require('../models/widget');

module.exports = Collection.extend({
    model: widgetModel,
    mainIndex: 'type',
});
