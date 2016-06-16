/* eslint-env jasmine */
var utildx = require('../client/util-crossfilter');
var Facet = require('../client/models/facet');
var Dataset = require('../client/models/dataset-crossfilter');
var missing = require('../client/misval');

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

  describe('Group reduction', function () {
    var facet = new Facet({type: 'constant'});
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

  describe('Facet baseValues', function () {
    var facet;
    var baseVal;

    it('categorial baseValueFn from property should be an string[]', function () {
      var datum = {'a': 10};
      facet = new Facet({accessor: 'a', type: 'categorial'});
      baseVal = utildx.baseValueFn(facet);
      expect(baseVal(datum)).toEqual([10]);
    });

    it('continuous baseValueFn from nested property should be number', function () {
      var datum = {'a': {b: 10}};
      facet = new Facet({accessor: 'a.b', type: 'continuous'});
      baseVal = utildx.baseValueFn(facet);
      expect(baseVal(datum)).toEqual(10);
    });

    it('deeply nested properties', function () {
      var datum = {'a': {b: {c: 'hello world'}}};
      facet = new Facet({accessor: 'a.b.c', type: 'categorial'});
      baseVal = utildx.baseValueFn(facet);
      expect(baseVal(datum)).toEqual(['hello world']);
    });

    it('MathJS basevalues', function () {
      var datum = {'a': 10, 'b': 5};
      facet = new Facet({accessor: 'a * b', type: 'continuous', kind: 'math'});
      baseVal = utildx.baseValueFn(facet);
      expect(baseVal(datum)).toEqual(50);
    });

    // TODO: time properties
  });

  describe('Facet missing or missing values', function () {
    var facet;
    var datum;
    var value;

    facet = new Facet({accessor: 'a', type: 'continuous'});
    value = utildx.valueFn(facet);

    it('for facet properties', function () {
      datum = {'a': Infinity};
      expect(value(datum)).toEqual(missing);

      datum = {};
      expect(value(datum)).toEqual(missing);

      datum = {a: undefined};
      expect(value(datum)).toEqual(missing);

      datum = {a: null};
      expect(value(datum)).toEqual(missing);

      datum = {a: 'not a number'};
      expect(value(datum)).toEqual(missing);
    });

    facet = new Facet({accessor: 'a.b', type: 'continuous'});
    value = utildx.valueFn(facet);

    it('for nested facet properties', function () {
      datum = {};
      expect(value(datum)).toEqual(missing);

      datum = {a: undefined};
      expect(value(datum)).toEqual(missing);

      datum = {a: null};
      expect(value(datum)).toEqual(missing);

      datum = {a: 'not a number'};
      expect(value(datum)).toEqual(missing);

      datum = {'a': {b: undefined}};
      expect(value(datum)).toEqual(missing);

      datum = {'a': {b: null}};
      expect(value(datum)).toEqual(missing);

      datum = {'a': {b: 'not a number'}};
      expect(value(datum)).toEqual(missing);
    });

    facet = new Facet({accessor: 'a', type: 'continuous', misvalAsText: '10, 20, "a", "b"'});
    value = utildx.valueFn(facet);

    it('using custom missing values from misvalAsText', function () {
      expect(value({a: 10})).toEqual(missing);
      expect(value({a: 20})).toEqual(missing);
      expect(value({a: 'a'})).toEqual(missing);
      expect(value({a: 'b'})).toEqual(missing);
    });
  });

  describe('Continuous Facet valueFn', function () {
    var facet = new Facet({
      accessor: 'a',
      type: 'continuous'
    });
    var value = utildx.valueFn(facet);

    it('should give proper values, or missing', function () {
      expect(value({a: 'a'})).toEqual(missing);
      expect(value({a: 1.0})).toEqual(1.0);
      expect(value({a: Infinity})).toEqual(missing);
      expect(value({a: NaN})).toEqual(missing);
    });
    // TODO exceedances for continuous facets
  });

  describe('Categorial Facet valueFn', function () {
    var facet = new Facet({
      accessor: 'a',
      type: 'categorial',
      categories: [{category: 'A', group: 'A'}, {category: 'B', group: 'B'}, {category: 'C', group: 'B'}]
    });
    var value = utildx.valueFn(facet);

    it('should relabel properly', function () {
      expect(value({a: 'A'})).toEqual(['A']);
      expect(value({a: 'B'})).toEqual(['B']);
      expect(value({a: 'C'})).toEqual(['B']);

      expect(value({a: ['B', 'C', 'F']})).toEqual(['B', 'B', 'F']);
    });
  });

  describe('Time Facet valueFn', function () {
    // TODO time valueFn
  });

  describe('Continuous Facet groupFn', function () {
    var facet = new Facet({accessor: 'a', type: 'continuous', minvalAsText: '0', maxvalAsText: '100'});
    it('should group', function () {
      var group = utildx.groupFn(facet);
      expect(group(4)).toBe('2.500');
    });
  });
  describe('Categorial Facet groupFn', function () {
    var facet = new Facet({accessor: 'a', type: 'categorial'});
    it('should group', function () {
      var group = utildx.groupFn(facet);
      expect(group(['a'])).toEqual(['a']);
    });
  });

  describe('Continuous facets support', function () {
    // create a dataset and add some points
    var dataset = new Dataset();
    var facet = new Facet({accessor: 'a', type: 'continuous'});
    dataset.add(facet);

    function addPoint (x) {
      dataset.crossfilter.add([{'a': x}]);
    }

    var i;
    for (i = 1; i < 1001; i++) {
      addPoint(i);
    }

    facet.minvalAsText = 0;
    facet.maxvalAsText = 1000;
    it('percentile transform', function () {
      facet.transform = 'percentiles';

      var P = utildx.valueFn(facet);
      expect(P({a: -1000})).toBe(0);
      expect(P({a: 1})).toBe(0);
      expect(P({a: 1000})).toBe(100);
      expect(P({a: 2000})).toBe(100);

      expect(P({a: 250})).toBe(25);
      expect(P({a: 500})).toBe(50);
      expect(P({a: 750})).toBe(75);
    });
    it('exceedance transform', function () {
      facet.transform = 'exceedances';

      var P = utildx.valueFn(facet);
      expect(P({a: -1000})).toBe(-900);
      expect(P({a: 1})).toBe(-900);
      expect(P({a: 1000})).toBe(900);
      expect(P({a: 2000})).toBe(900);

      expect(P({a: 250})).toBe(-4); // one in 4 smaller than 250
      expect(P({a: 500.5})).toBe(2); // one in 2 smaller/larger than 500.5
      expect(P({a: 750})).toBe(4); // one in 4 larger than 750
    });
  });
});
