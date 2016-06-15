/* eslint-env jasmine */
var Facet = require('../client/models/facet');

describe('The facet class', function () {
  it('should have a constant facet with bins()', function () {
    var facet = new Facet({type: 'constant'});
    expect(facet.bins).toBeDefined();
    expect(facet.bins()).toEqual([{label: '1', group: '1', value: '1'}]);
  });
  describe('should provide a bins() method', function () {
    var facet = new Facet({accessor: 'a', type: 'continuous', minvalAsText: '0', maxvalAsText: '100'});
    it('should work for continuous facets', function () {
      facet.groupingContinuous = 'fixedn';
      facet.groupingParam = 2;
      expect(facet.bins()).toEqual([
        {label: '25.00', group: [0, 50], value: 25},
        {label: '75.00', group: [50, 100], value: 75}
      ]);

      facet.groupingContinuous = 'fixeds';
      facet.groupingParam = 25;
      expect(facet.bins()).toEqual([
        {label: '12.50', group: [0, 25], value: 12.5},
        {label: '37.50', group: [25, 50], value: 37.5},
        {label: '62.50', group: [50, 75], value: 62.5},
        {label: '87.50', group: [75, 100], value: 87.5}
      ]);

      facet.groupingContinuous = 'fixedsc';
      facet.minvalAsText = '-10';
      facet.maxvalAsText = '10';
      facet.groupingParam = 10;
      expect(facet.bins()).toEqual([
        {label: '-7.500', group: [-10, -5], value: -7.5},
        {label: '0.000', group: [-5, 5], value: 0},
        {label: '7.500', group: [5, 10], value: 7.5}
      ]);

      facet.groupingContinuous = 'log';
      facet.minvalAsText = 1;
      facet.maxvalAsText = 100;
      facet.groupingParam = 2;
      expect(facet.bins()).toEqual([
        {label: '10.00', group: [1, 10.000000000000004], value: 5.500000000000002},
        {label: '100.0', group: [10.000000000000004, 100.00000000000007], value: 55.000000000000036}
      ]);
    });
    it('should work for categorial facets', function () {
      facet.type = 'categorial';
      facet.categories = [{category: 'A', group: 'A'}, {category: 'B', group: 'B'}, {category: 'C', group: 'B'}];
      expect(facet.bins()).toEqual([
        {label: 'A', group: 'A', value: 'A'},
        {label: 'B', group: 'B', value: 'B'}
      ]);
    });
  });
});
