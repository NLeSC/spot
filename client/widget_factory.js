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
        modelType: "barchart",
        newModel:  require('./models/barchart.js'),
        newView:   require('./views/barchart.js')
    },
    {
        modelType: "heatmap",
        newModel:  require('./models/heatmap.js'),
        newView:   require('./views/heatmap.js')
    },
    {
        modelType: "correlation",
        newModel:  require('./models/correlation.js'),
        newView:   require('./views/correlation.js')
    },
    {
        modelType: "piechart",
        newModel:  require('./models/piechart.js'),
        newView:   require('./views/piechart.js')
    },
    {
        modelType: "datatable",
        newModel:  require('./models/datatable.js'),
        newView:   require('./views/datatable.js')
    },
    {
        modelType: "scatterplot",
        newModel:  require('./models/scatterplot.js'),
        newView:   require('./views/scatterplot.js')
    },
    {
        modelType: "boxplot",
        newModel:  require('./models/boxplot.js'),
        newView:   require('./views/boxplot.js')
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

