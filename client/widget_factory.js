var Collection = require('ampersand-collection');
var AmpersandModel = require('ampersand-model');

/**
 * A factory producing the Ampersand models corresponding to the different chart types.
 * @example
 * var factory = require('./widget_factory')
 *
 * var model = factory.newModel(attr,options);
 * @module client/widget_factory
 */

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
 * An Ampersand collection containing all available widgets
 */
module.exports.widgets = new WidgetCollection([
  {
    modelType: 'piechart',
    newModel: require('./models/piechart.js')
  },
  {
    modelType: 'barchart',
    newModel: require('./models/barchart.js')
  },
  {
    modelType: 'linechart',
    newModel: require('./models/linechart.js')
  },
  {
    modelType: 'radarchart',
    newModel: require('./models/radarchart.js')
  },
  {
    modelType: 'polarareachart',
    newModel: require('./models/polarareachart.js')
  },
  {
    modelType: 'bubbleplot',
    newModel: require('./models/bubbleplot.js')
  }
  // Register new widgets here
]);

/**
 * Create a new Ampersand model for a widget
 * @param {Object} attrs - Used for initialization of model properties, passed on to the model constructor.
 * @param {Object} options - passed on to the model constructor, see https://github.com/AmpersandJS/ampersand-model#constructorinitialize-new-extendedampersandmodelattrs-options
 * @returns {Model} model - An Ampersand model
 */
module.exports.newModel = function newModel (attrs, options) {
  var entry = module.exports.widgets.get(attrs.modelType);
  var constructor = entry.newModel;
  return new constructor(attrs, options);
};
