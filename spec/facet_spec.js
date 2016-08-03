/* eslint-env jasmine */
var Facet = require('../client/models/facet');

function stripId (o) {
  var result = o.toJSON();
  result.forEach(function (s) {
    delete s.id;
  });
  delete result.id;
  return result;
}

describe('The facet class', function () {
  describe('should provide a setContinouousGroups() method', function () {
    var facet = new Facet({accessor: 'a', type: 'continuous', minvalAsText: '0', maxvalAsText: '100'});
    var result;

    it('that should work for fixed number of bins', function () {
      facet.groupingContinuous = 'fixedn';
      facet.groupingParam = 2;
      facet.setContinuousGroups();
      result = stripId(facet.groups);
      expect(result).toEqual([
        { min: 0, max: 50, count: 0, label: '25.000', value: 25 },
        { min: 50, max: 100, count: 0, label: '75.000', value: 75 }
      ]);
    });

    it('that should work for fixed bin size', function () {
      facet.groupingContinuous = 'fixeds';
      facet.groupingParam = 25;
      facet.setContinuousGroups();
      result = stripId(facet.groups);
      expect(result).toEqual([
        { min: 0, max: 25, count: 0, label: '12.500', value: 12.5 },
        { min: 25, max: 50, count: 0, label: '37.500', value: 37.5 },
        { min: 50, max: 75, count: 0, label: '62.500', value: 62.5 },
        { min: 75, max: 100, count: 0, label: '87.500', value: 87.5 }
      ]);
    });

    it('that should work for fixed bin size centered on 0', function () {
      facet.groupingContinuous = 'fixedsc';
      facet.minvalAsText = '-10';
      facet.maxvalAsText = '10';
      facet.groupingParam = 10;
      facet.setContinuousGroups();
      result = stripId(facet.groups);
      expect(result).toEqual([
        { min: -15, max: -5, count: 0, label: '-10.000', value: -10 },
        { min: -5, max: 5, count: 0, label: '0.0000', value: 0 },
        { min: 5, max: 15, count: 0, label: '10.000', value: 10 }
      ]);
    });

    it('that should do logarithmic binning', function () {
      facet.groupingContinuous = 'log';
      facet.minvalAsText = '1';
      facet.maxvalAsText = '100';
      facet.groupingParam = 2;
      facet.setContinuousGroups();
      result = stripId(facet.groups);
      expect(result).toEqual([
        { min: 1, max: 10.000000000000004, count: 0, label: '3.1623', value: 1 },
        { min: 10.000000000000004, max: 100.00000000000007, count: 0, label: '31.623', value: 10.000000000000004 }
      ]);
    });
  });
});
