/* eslint-env jasmine */
var widgetFactory = require('../client/widget-factory');
var AmpersandModel = require('ampersand-model');

describe('Model factories', function () {
  it('should create a new model', function () {
    var model = widgetFactory.newModel({modelType: 'barchart'});

    expect(model).not.toBe(null);
    expect(model instanceof AmpersandModel).toBe(true);
  });
});
