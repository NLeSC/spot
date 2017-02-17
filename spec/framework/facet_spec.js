/* eslint-env jasmine */
var Facet = require('../../framework/facet');

describe('The facet class', function () {
  it('can instantiate', function () {
    var facet = new Facet();
    expect(facet instanceof Facet).toBe(true);
  });
});
