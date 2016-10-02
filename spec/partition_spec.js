/* eslint-env jasmine */
var Partition = require('../client/models/partition');

function printAndStripIDs (collection) {
  var printed = collection.toJSON();
  printed.forEach(function (p) {
    delete p.id;
    delete p.isSelected;
  });
  return printed;
}

describe('The Partition class', function () {
  describe('should do partitioning of a datetime facet', function () {
    // TODO
  });
  describe('should do partitioning of a categorial facet', function () {
    // TODO
  });
  describe('should do partitioning of a continuous facet', function () {
    it('should group a fixed number of bins', function () {
      var partition = new Partition({
        type: 'continuous',
        minval: 0,
        maxval: 10,
        groupingParam: 10,
        groupingContinuous: 'fixedn'
      });
      partition.setGroups();

      expect(partition.groups.length).toEqual(10);
      expect(printAndStripIDs(partition.groups)).toEqual([
        { min: 0, max: 1, count: 0, label: '0.50000', value: 0.5 },
        { min: 1, max: 2, count: 0, label: '1.5000', value: 1.5 },
        { min: 2, max: 3, count: 0, label: '2.5000', value: 2.5 },
        { min: 3, max: 4, count: 0, label: '3.5000', value: 3.5 },
        { min: 4, max: 5, count: 0, label: '4.5000', value: 4.5 },
        { min: 5, max: 6, count: 0, label: '5.5000', value: 5.5 },
        { min: 6, max: 7, count: 0, label: '6.5000', value: 6.5 },
        { min: 7, max: 8, count: 0, label: '7.5000', value: 7.5 },
        { min: 8, max: 9, count: 0, label: '8.5000', value: 8.5 },
        { min: 9, max: 10, count: 0, label: '9.5000', value: 9.5 }
      ]);
    });

    it('should group a fixed size of bins', function () {
      var partition = new Partition({
        type: 'continuous',
        minval: -10,
        maxval: 10,
        groupingParam: 5,
        groupingContinuous: 'fixeds'
      });
      partition.setGroups();

      expect(partition.groups.length).toEqual(4);
      expect(printAndStripIDs(partition.groups)).toEqual([
        { min: -10, max: -5, count: 0, label: '-7.5000', value: -7.5 },
        { min: -5, max: 0, count: 0, label: '-2.5000', value: -2.5 },
        { min: 0, max: 5, count: 0, label: '2.5000', value: 2.5 },
        { min: 5, max: 10, count: 0, label: '7.5000', value: 7.5 }
      ]);
    });

    it('should group a fixed size of centered bins', function () {
      var partition = new Partition({
        type: 'continuous',
        minval: -10,
        maxval: 10,
        groupingParam: 5,
        groupingContinuous: 'fixedsc'
      });
      partition.setGroups();

      expect(partition.groups.length).toEqual(5);
      expect(printAndStripIDs(partition.groups)).toEqual([
        { min: -12.5, max: -7.5, count: 0, label: '-10.000', value: -10 },
        { min: -7.5, max: -2.5, count: 0, label: '-5.0000', value: -5 },
        { min: -2.5, max: 2.5, count: 0, label: '0.0000', value: 0 },
        { min: 2.5, max: 7.5, count: 0, label: '5.0000', value: 5 },
        { min: 7.5, max: 12.5, count: 0, label: '10.000', value: 10 }
      ]);
    });

    it('should group logarithmically', function () {
      var partition = new Partition({
        type: 'continuous',
        minval: 1,
        maxval: 1000,
        groupingParam: 3,
        groupingContinuous: 'log'
      });
      partition.setGroups();

      expect(partition.groups.length).toEqual(3);
      expect(printAndStripIDs(partition.groups)).toEqual([
        { min: 1, max: 10, count: 0, label: '10.000', value: 1 },
        { min: 10, max: 99.99999999999999, count: 0, label: '100.00', value: 10 },
        { min: 99.99999999999999, max: 1000.0000000000005, count: 0, label: '1000.0', value: 99.99999999999999 }
      ]);
    });
  });
});
