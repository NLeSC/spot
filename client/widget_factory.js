var app = require('ampersand-app');
var Collection = require('ampersand-collection');
var AmpersandModel = require('ampersand-model');

// Usage:

// var factory = require('./widget_factory');
//
// var model = factory.newModel(attr,options);

var widgetEntry = AmpersandModel.extend({
    props: {
        modelType: {type: 'string', required: true},
        newModel: {type: 'any', required: true}
    }
});

var widgetCollection = Collection.extend({
    model: widgetEntry,
    mainIndex: 'modelType',
});

// Register the widgets here
var widgets = new widgetCollection([
    {
        modelType: "piechart",
        newModel:  require('./models/piechart.js'),
    },
    {
        modelType: "barchart",
        newModel:  require('./models/barchart.js'),
    },
    {
        modelType: "linechart",
        newModel:  require('./models/linechart.js'),
    },
    {
        modelType: "radarchart",
        newModel:  require('./models/radarchart.js'),
    },
    {
        modelType: "polarareachart",
        newModel:  require('./models/polarareachart.js'),
    },
    {
        modelType: "bubbleplot",
        newModel:  require('./models/bubbleplot.js'),
    },
]); 


module.exports = {
    widgets: widgets,
    newModel: function (attrs,options) {
        var entry = widgets.get(attrs.modelType);
        var constructor = entry.newModel;
        return new constructor(attrs,options);
    }
};

