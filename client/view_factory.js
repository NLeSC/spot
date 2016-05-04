var app = require('ampersand-app');
var Collection = require('ampersand-collection');
var AmpersandModel = require('ampersand-model');

// Usage:

// var factory = require('./widget_factory');
//
// var view = factory.newView(options);

var widgetEntry = AmpersandModel.extend({
    props: {
        modelType: {type: 'string', required: true},
        newView: {type: 'any', required: false},
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
        newView:   require('./views/widget-chartjs.js')
    },
    {
        modelType: "barchart",
        newView:   require('./views/widget-chartjs.js')
    },
    {
        modelType: "linechart",
        newView:   require('./views/widget-chartjs.js')
    },
    {
        modelType: "radarchart",
        newView:   require('./views/widget-chartjs.js')
    },
    {
        modelType: "polarareachart",
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
};

