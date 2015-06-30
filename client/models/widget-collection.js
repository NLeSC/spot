var AmpersandModel = require('ampersand-model');
var Collection = require('ampersand-collection');

var Histogram = require('../views/histogram');

var widgetModel = AmpersandModel.extend({
    props: {
        type: 'string',
        contentConstructor: ['any', false, ],
    }
});

module.exports = Collection.extend({
    model: widgetModel,
    mainIndex: 'type',
    initialize: function() {
        this.add( {type: 'histogram', contentConstructor: Histogram});
    },
});
