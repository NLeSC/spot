/* eslint-env jasmine */
/* eslint-disable no-native-reassign */
/* eslint-disable no-undef */

// mocks to make the test work
// window = jasmine.createSpyObj('window', ['addEventListener']);
Element = jasmine.createSpyObj('Element', ['prototype']);

var viewF = require('../client/view-factory');
var widgetF = require('../client/widget-factory');

describe('Factories', function () {
  it('produce valid models', function () {
    var m = widgetF.newModel({
      modelType: 'barchart'
    });
    expect(m.isState).toBe(true);

    var v = viewF.newView({
      model: m
    });
    expect(v.isState).toBe(true);
  });
});
