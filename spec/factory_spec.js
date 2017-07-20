/* eslint-env jasmine */
/* eslint-disable no-native-reassign */
/* eslint-disable no-undef */

var widgetFactory = require('../src/widgets/widget-factory.js');

describe('Factories', function () {
  it('produce valid models and views', function () {
    var m = widgetFactory.newModel({
      modelType: 'barchart'
    });
    expect(m.isState).toBe(true);
  });
});
