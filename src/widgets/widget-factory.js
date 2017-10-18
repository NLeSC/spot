var Collection = require('ampersand-collection');
var AmpersandModel = require('ampersand-model');

var widgetEntry = AmpersandModel.extend({
  props: {
    modelType: {type: 'string', required: true},
    newModel: {type: 'any', required: true}
  }
});

var WidgetCollection = Collection.extend({
  model: widgetEntry,
  mainIndex: 'modelType'
});

/**
 * A collection of Ampersand widget containing all available chart types
 * @module widgets/widget-factory
 */
module.exports.widgets = new WidgetCollection([
  {
    modelType: 'piechart',
    newModel: require('./models/piechart')
  },
  {
    modelType: 'horizontalbarchart',
    newModel: require('./models/horizontalbarchart')
  },
  {
    modelType: 'barchart',
    newModel: require('./models/barchart')
  },
  {
    modelType: 'linechart',
    newModel: require('./models/linechart')
  },
  {
    modelType: 'radarchart',
    newModel: require('./models/radarchart')
  },
  {
    modelType: 'bubbleplot',
    newModel: require('./models/bubbleplot')
  },
  {
    modelType: 'scatterchart',
    newModel: require('./models/scatter')
  },
  {
    modelType: 'networkchart',
    newModel: require('./models/sigma')
  }
  // Register new widgets here
]);

/**
 * Create a new Ampersand model for a widget
 * @param {Object} attrs - Used for initialization of model properties, passed on to the model constructor.
 * @param {Object} options - passed on to the model constructor, see https://github.com/AmpersandJS/ampersand-model#constructorinitialize-new-extendedampersandmodelattrs-options
 * @returns {Model} widget - An Ampersand model representing the widget
 */
module.exports.newModel = function newModel (attrs, options) {
  var model;
  var entry = module.exports.widgets.get(attrs.modelType);
  var constructor = entry.newModel;
  model = new constructor(attrs, options);
  model.modelType = attrs.modelType;

  return model;
};
