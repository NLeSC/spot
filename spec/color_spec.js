/* eslint-env jasmine */
var colors = require('../client/colors');

describe('The color module', function () {
  it('should provide an unselected color ', function () {
    expect(colors.unselectedColor.css).toBeDefined();
  });
  it('should provide a color by number', function () {
    expect(colors.getColor(10).css).toBeDefined();
  });
});
