var Collection = require('ampersand-collection');
var AmpersandModel = require('ampersand-model');

var Chart = require('chart.js');

// extend plot with errorbars
var extendWithErrorBar = require('./chartjs-errorbars');
extendWithErrorBar(Chart, 'line', 'lineError');
extendWithErrorBar(Chart, 'bubble', 'bubbleError');
extendWithErrorBar(Chart, 'bar', 'barError');
extendWithErrorBar(Chart, 'horizontalBar', 'horizontalBarError');
extendWithErrorBar(Chart, 'bubble', 'bubbleError');

// extend plots with a duration scale type
var extendWithDurationScale = require('./chartjs-duration-scale');
extendWithDurationScale(Chart);

/**
 * A factory producing the Ampersand views corresponding to the different chart types.
 * @example
 * var factory = require('./view-factory')
 *
 * var view = factory.newView(options);
 * @module client/view-factory
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
    newView: require('./views/chartjs')
  },
  {
    modelType: 'barchart',
    newView: require('./views/chartjs')
  },
  {
    modelType: 'horizontalbarchart',
    newView: require('./views/chartjs')
  },
  {
    modelType: 'linechart',
    newView: require('./views/chartjs1d')
  },
  {
    modelType: 'radarchart',
    newView: require('./views/chartjs')
  },
  {
    modelType: 'bubbleplot',
    newView: require('./views/chartjs2d')
  },
  {
    modelType: 'scatterchart',
    newView: require('./views/scatter')
  },
  {
    modelType: 'networkchart',
    newView: require('./views/sigma')
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
