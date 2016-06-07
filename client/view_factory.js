var Collection = require('ampersand-collection');
var AmpersandModel = require('ampersand-model');

/**
 * A factory producing Ampersand views for the different chart types
 * @example
 * var factory = require('./view_factory')
 *
 * var view = factory.newView(options);
 * @module client/view_factory
 */

var widgetEntry = AmpersandModel.extend({
  props: {
    modelType: {type: 'string', required: true},
    newView: {type: 'any', required: false}
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
    newView: require('./views/widget-chartjs.js')
  },
  {
    modelType: 'barchart',
    newView: require('./views/widget-chartjs.js')
  },
  {
    modelType: 'linechart',
    newView: require('./views/widget-chartjs.js')
  },
  {
    modelType: 'radarchart',
    newView: require('./views/widget-chartjs.js')
  },
  {
    modelType: 'polarareachart',
    newView: require('./views/widget-chartjs.js')
  },
  {
    modelType: 'bubbleplot',
    newView: require('./views/widget-chartjs2d.js')
  }
  // Register new widgets here
]);

/**
 * Create a new Ampersand view for a widget
 * @param {Object} options - passed on to the view constructor, see https://github.com/AmpersandJS/ampersand-view#constructor-new-ampersandviewoptions
 * @param {Object} options.model - The widget
 * @returns {View} view - An Ampersand view
 */
module.exports.newView = function newView (options) {
  var entry = module.exports.widgets.get(options.model.modelType);
  var constructor = entry.newView;
  return new constructor(options);
};
