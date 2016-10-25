/* eslint-env jasmine */
var utildx = require('../client/util-crossfilter');
var Facet = require('../client/models/facet');
var Dataset = require('../client/models/dataset-client');
var Aggregate = require('../client/models/aggregate');
var missing = require('../client/misval');

describe('crossfilter utility functions', function () {
  describe('Aggregation ', function () {
    var aggregate = new Aggregate();
    var subgroup = {sum: 56, count: 3};

    it('should be by sum', function () {
      aggregate.operation = 'sum';
      var reduceFn = utildx.reduceFn(aggregate);
      expect(reduceFn(subgroup)).toBe(56);
    });

    it('should be by count', function () {
      aggregate.operation = 'count';
      var reduceFn = utildx.reduceFn(aggregate);
      expect(reduceFn(subgroup)).toBe(3);
    });

    it('should be by average', function () {
      aggregate.operation = 'avg';
      var reduceFn = utildx.reduceFn(aggregate);
      expect(reduceFn(subgroup)).toBe(56 / 3);
    });
  });

  describe('Facet baseValues', function () {
    var facet;
    var baseVal;

    it('categorial baseValueFn from property should be an string', function () {
      var datum = {'a': 10};
      facet = new Facet({accessor: 'a', type: 'categorial'});
      baseVal = utildx.baseValueFn(facet);
      expect(baseVal(datum)).toEqual(10);
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
      expect(baseVal(datum)).toEqual('hello world');
    });

    it('from array valued data', function () {
      var datum = {'a': ['hello', 'world', 'again']};
      facet = new Facet({accessor: 'a[]', type: 'categorial'});
      baseVal = utildx.baseValueFn(facet);
      expect(baseVal(datum)).toEqual(['hello', 'world', 'again']);
    });
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
      expect(value({a: null})).toEqual(missing);
    });
    // TODO exceedances for continuous facets
  });

  describe('Categorial Facet valueFn', function () {
    var facet = new Facet({
      accessor: 'a',
      type: 'categorial'
    });
    var value = utildx.valueFn(facet);

    it('should relabel properly', function () {
      expect(value({a: 'a'})).toEqual('a');
      expect(value({a: 1.0})).toEqual(1);  // FIXME should be a string
      expect(value({a: Infinity})).toEqual(Infinity);  // FIXME should be missing?
      expect(value({a: NaN})).toEqual(NaN);  // FIXME should be missing?
    });
  });

  describe('TimeOrDuration Facet valueFn', function () {
    // create a dataset to get functional facets
    var dataset = new Dataset();
    var facet = new Facet({accessor: 'a', type: 'timeorduration'});
    dataset.facets.add(facet);

    it('datetime parsing without timezone', function () {
      facet.timeTransform.type = 'datetime';

      var valueFn = utildx.valueFn(facet);
      var datum = {a: '2016-07-04 17:40'};

      var parsed = valueFn(datum);
      var alternate = new Date(datum.a);

      expect(parsed - alternate).toEqual(0);
    });
    it('datetime parsing with timezone', function () {
      var valueFn = utildx.valueFn(facet);
      var datum1 = {a: '2016-07-04T17:40:00+02:00'};
      var datum2 = {a: '2016-07-04T17:40:00+01:00'};

      var parsed1 = valueFn(datum1);
      var parsed2 = valueFn(datum2);

      expect(parsed1 - parsed2).toEqual(-3600000);
    });
    it('datetime parsing without timezone, with new timezone', function () {
      facet.timeTransform.type = 'datetime';
      facet.timeTransform.zone = 'Zulu';
      var valueFn = utildx.valueFn(facet);
      var datum1 = {a: '2016-07-04 17:40'};

      var parsed1 = valueFn(datum1);

      expect(parsed1.zoneAbbr()).toBe('UTC');
    });
    it('datetime parsing without timezone, with new timezone', function () {
      facet.timeTransform.type = 'datetime';
      facet.timeTransform.zone = 'Zulu';
      var valueFn = utildx.valueFn(facet);
      var datum1 = {a: '2016-07-04 17:40+02:00'};
      var datum2 = {a: '2016-07-04 15:40+00:00'};

      var parsed1 = valueFn(datum1);
      var parsed2 = valueFn(datum2);

      expect(parsed1.zoneAbbr()).toBe('UTC');
      expect(parsed1 - parsed2).toEqual(0);
    });
    it('duration parsing float + units', function () {
      facet.timeTransform.type = 'duration';
      facet.timeTransform.transformedUnits = 'seconds';
      facet.units = 'minutes';
      var valueFn = utildx.valueFn(facet);
      var datum = {a: '10'};

      var parsed = valueFn(datum);
      expect(parsed).toEqual(600);
    });
    it('duration parsing ISO string', function () {
      facet.timeTransform.type = 'duration';
      facet.timeTransform.transformedUnits = 'seconds';
      facet.units = '';
      var valueFn = utildx.valueFn(facet);
      var datum = {a: 'PT23H59M'};

      var parsed = valueFn(datum);
      expect(parsed).toEqual(86340);
    });
  });

  describe('categorialTransform:', function () {
    var facet = new Facet({
      accessor: 'a',
      type: 'categorial',
      categorialTransform: {
        rules: [{expression: 'A', group: 'A'}, {expression: 'B', group: 'B'}, {expression: 'C', group: 'B'}]
      }
    });
    var value = utildx.valueFn(facet);

    it('should relabel properly', function () {
      expect(value({a: 'A'})).toEqual(['A']);
      expect(value({a: 'B'})).toEqual(['B']);
      expect(value({a: 'C'})).toEqual(['B']);

      expect(value({a: ['B', 'C', 'F']})).toEqual(['B', 'B', 'Other']);
    });
  });

  describe('continuousTransform:', function () {
    // create a dataset and add some points
    var dataset = new Dataset();
    var facet = new Facet({accessor: 'a', type: 'continuous'});
    dataset.facets.add(facet);

    function addPoint (x) {
      dataset.crossfilter.add([{'a': x}]);
    }

    var i;
    for (i = 1; i < 1001; i++) {
      addPoint(i);
    }

    facet.minvalAsText = '1';
    facet.maxvalAsText = '1000';
    it('percentile', function () {
      facet.continuousTransform.setPercentiles();

      var P = utildx.valueFn(facet);
      expect(P({a: -1000})).toBe(0);
      expect(P({a: 1})).toBe(0);
      expect(P({a: 1000})).toBe(100);
      expect(P({a: 2000})).toBe(100);

      expect(P({a: 250.25})).toBe(25);
      expect(P({a: 500.5})).toBe(50);
      expect(P({a: 750.75})).toBe(75);

      // inverse transform
      expect(facet.continuousTransform.inverse(-1)).toEqual(1);
      expect(facet.continuousTransform.inverse(0)).toEqual(1);
      expect(facet.continuousTransform.inverse(25)).toEqual(250.25);
      expect(facet.continuousTransform.inverse(50)).toEqual(500.5);
      expect(facet.continuousTransform.inverse(75)).toEqual(750.75);
      expect(facet.continuousTransform.inverse(100)).toEqual(1000);
      expect(facet.continuousTransform.inverse(200)).toEqual(1000);

      // range
      expect(facet.continuousTransform.transformedMin).toEqual(0);
      expect(facet.continuousTransform.transformedMax).toEqual(100);
    });
    it('exceedance', function () {
      facet.continuousTransform.setExceedances();

      var P = utildx.valueFn(facet);
      expect(P({a: -1000})).toBe(-1000);
      expect(P({a: 1})).toBe(-1000);
      expect(P({a: 1000})).toBe(1000);
      expect(P({a: 2000})).toBe(1000);

      expect(P({a: 251})).toBe(-4); // one in 4 smaller than 250
      expect(P({a: 500.5})).toBe(0); // one in 2 smaller/larger than 500.5
      expect(P({a: 750})).toBe(4); // one in 4 larger than 750
    });
  });

  describe('timeTransform:', function () {
    // create a dataset to get functional facets
    var dataset = new Dataset();
    var facet = new Facet({accessor: 'a', type: 'timeorduration'});
    dataset.facets.add(facet);

    it('datetime to duration', function () {
      facet.timeTransform.type = 'datetime';
      facet.timeTransform.transformedReference = '2015-01-01 00:00';
      facet.timeTransform.transformedUnits = 'hours';

      var valueFn = utildx.valueFn(facet);
      var datum = {a: '2015-01-01 10:30'};

      var parsed = valueFn(datum);
      expect(parsed).toEqual(10.5);
    });
    it('datetime to string', function () {
      facet.timeTransform.type = 'datetime';
      facet.timeTransform.transformedReference = '';
      facet.timeTransform.transformedFormat = 'dddd';

      var valueFn = utildx.valueFn(facet);
      var datum = {a: '2015-01-01 10:30'};

      var parsed = valueFn(datum);
      expect(parsed).toEqual('Thursday');
    });
    it('timezone', function () {
      facet.timeTransform.type = 'datetime';
      facet.timeTransform.zone = 'Europe/Amsterdam';
      facet.timeTransform.transformedReference = '';
      facet.timeTransform.transformedFormat = 'NONE';
      facet.timeTransform.transformedZone = 'America/New_York';

      var valueFn = utildx.valueFn(facet);
      var datum = {a: '2015-01-01 12:00'};

      var parsed = valueFn(datum);
      expect(parsed.hours()).toEqual(6);
      expect(parsed.zoneAbbr()).toEqual('EST');
    });
    it('duration to datetime', function () {
      facet.timeTransform.type = 'duration';
      facet.units = 'days';
      facet.timeTransform.transformedReference = '2015-01-01 00:00';
      facet.timeTransform.transformedZone = 'Zulu';

      var valueFn = utildx.valueFn(facet);
      var datum = {a: '10'};

      var parsed = valueFn(datum);
      expect(parsed.format()).toEqual('2015-01-11T00:00:00Z');
    });
    it('duration to different units', function () {
      facet.timeTransform.type = 'duration';
      facet.units = 'days';
      facet.timeTransform.transformedReference = '';
      facet.timeTransform.transformedZone = 'NONE';
      facet.timeTransform.transformedUnits = 'weeks';

      var valueFn = utildx.valueFn(facet);
      var datum = {a: '17.5'};

      var parsed = valueFn(datum);
      expect(parsed).toEqual(2.5);
    });
  });
});
