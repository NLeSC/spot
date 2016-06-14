/* eslint-env jasmine */
var util = require('../client/util');
var Facet = require('../client/models/facet');

describe('utility functions', function () {
  describe('general utility functions', function () {
    it('newId returns different ID\'s on repeated calls', function () {
      var idA = util.newId();
      var idB = util.newId();

      expect(idA).not.toBe(idB);
    });

    it('unitFacet returns propor facet', function () {
      var facet = util.unitFacet();

      expect(facet instanceof Facet).toBe(true);
      expect(facet.type).toBe('constant');
    });
  });
});
