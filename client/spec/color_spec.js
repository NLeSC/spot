/* eslint-env jasmine */
var colors = require('../colors');

describe('The color module', function () {
  it('should provide an unselected color ', function () {
    expect(colors.unselectedColor.css).toBeDefined();
  });
  it('should provide a color by number', function () {
    expect(colors.getColor(10).css).toBeDefined();
  });
  it('should generate a lot of colors', function () {
    var i;
    var prv;
    var nxt;

    nxt = colors.getColor(0).css();
    for (i = 1; i < 2000; i++) {
      prv = nxt;
      nxt = colors.getColor(i).css();
      expect(nxt).toBeDefined();
      expect(nxt).not.toEqual(prv);
    }
  });
});
