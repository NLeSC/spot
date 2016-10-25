/* eslint-env jasmine */
/* eslint-disable no-native-reassign */
/* eslint-disable no-undef */

var widgetF = require('../widgets/widget-factory');

describe('Factories', function () {
  it('produce valid models and views', function () {
    var m = widgetF.newModel({
      modelType: 'barchart'
    });
    expect(m.isState).toBe(true);
  });
});
