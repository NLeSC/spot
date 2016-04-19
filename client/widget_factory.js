var app = require('ampersand-app');
var Collection = require('ampersand-collection');
var AmpersandModel = require('ampersand-model');

// Usage:

// var factory = require('./widget_factory');
//
// var model = factory.newModel(attr,options);
// var view = factory.newView(options);

var widgetEntry = AmpersandModel.extend({
    props: {
        modelType: {type: 'string', required: true},
        newView: {type: 'any', required: true},
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
        newView:   require('./views/widget-chartjs.js')
    },
    {
        modelType: "barchart",
        newModel:  require('./models/barchart.js'),
        newView:   require('./views/widget-chartjs.js')
    },
    {
        modelType: "linechart",
        newModel:  require('./models/linechart.js'),
        newView:   require('./views/widget-chartjs.js')
    },
    {
        modelType: "radarchart",
        newModel:  require('./models/radarchart.js'),
        newView:   require('./views/widget-chartjs.js')
    },
    {
        modelType: "polarareachart",
        newModel:  require('./models/polarareachart.js'),
        newView:   require('./views/widget-chartjs.js')
    },
]); 


module.exports = {
    widgets: widgets,
    newView: function (options) {
        var entry = widgets.get(options.model.modelType);
        var constructor = entry.newView;
        return new constructor(options);
    },
    newModel: function (attrs,options) {
        var entry = widgets.get(attrs.modelType);
        var constructor = entry.newModel;
        return new constructor(attrs,options);
    }
};

