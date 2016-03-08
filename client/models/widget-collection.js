var Collection = require('ampersand-collection');
var Widget = require('../models/widget');
var widgetFactory = require('../widget_factory');

module.exports = Collection.extend({
    model: function (attrs, options) {
        return widgetFactory.newModel(attrs,options);
    },
    isModel: function (model) {
        return model.isState; // Allow any ampersand state to be stored
    }
});
