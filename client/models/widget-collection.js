var AmpersandModel = require('ampersand-model');
var Collection = require('ampersand-collection');

var histogramView = require('../views/histogram');
var histogramModel = require('../models/histogram');

var widgetModel = AmpersandModel.extend({
    props: {
        type: 'string',
        contentView: ['any', false, ],
        contentModel: ['any', false ],
    }
});

module.exports = Collection.extend({
    model: widgetModel,
    mainIndex: 'type',
    initialize: function() {
        this.add( {type: 'histogram', contentView: histogramView, contentModel: histogramModel});
    },
});
