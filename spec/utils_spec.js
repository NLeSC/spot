/* eslint-env jasmine */
var util = require('../client/util');
var utildx = require('../client/util-crossfilter');
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
      expect(facet.type).toBe('categorial');
      expect(facet.reduction).toBe('count');
    });
  });

  describe('crossfilter utility functions', function () {
    it('should unpack this array', function () {
      var groups = [
        { key: 'hello', value: { 'one': { sum: 1, count: 1 } } },
        { key: 'world', value: { 'two': { sum: 2, count: 5 } } },
        { key: ['world', 'again'], value: { 'two': { sum: 2, count: 2 }, 'three': { sum: 3, count: 3 } } }
      ];
      var answer = [
        { key: 'hello', value: { 'one': { sum: 1, count: 1 } } },
        { key: 'world', value: { 'two': { sum: 4, count: 7 }, 'three': { sum: 3, count: 3 } } },
        { key: 'again', value: { 'two': { sum: 2, count: 2 }, 'three': { sum: 3, count: 3 } } }
      ];
      var unpacked = utildx.unpackArray(groups);

      expect(unpacked).toEqual(answer);
    });

    describe('reduction', function () {
      var facet = util.unitFacet();
      var subgroup = {sum: 56, count: 3};

      it('should be by sum', function () {
        facet.reduction = 'sum';
        var reduceFn = utildx.reduceFn(facet);
        expect(reduceFn(subgroup)).toBe(56);
      });

      it('should be by count', function () {
        facet.reduction = 'count';
        var reduceFn = utildx.reduceFn(facet);
        expect(reduceFn(subgroup)).toBe(3);
      });

      it('should be by average', function () {
        facet.reduction = 'avg';
        var reduceFn = utildx.reduceFn(facet);
        expect(reduceFn(subgroup)).toBe(56 / 3);
      });
    });
  });
});
