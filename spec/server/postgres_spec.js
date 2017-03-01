/* eslint-env jasmine */
var postgresUtil = require('../../server/server-sql-util');

var DatetimeTransform = require('../../framework/facet/datetime-transform');
var DurationTransform = require('../../framework/facet/duration-transform');
// var ContinuousTransform = require('../../framework/facet/continuous-transform');
// var CategorialTransform = require('../../framework/facet/categorial-transform');

var utilPg = require('../../server/server-postgres');
utilPg.setConnectionString('postgres://postgres@localhost/spot_test');

// expressionType is either: facet's transformed value is:
// 1. datetime      a. datetime
// 2. duration      b. duration
// 3. continuous    c. continuous
// 4. categorial    d. categorial
// 5. text          e. text
//
// implemented transforms:
// 1a, 1b, 1c, 1d, 1e, 2a, 2b, 2c, 2e, 3e, 4e, 5e
// illegal:
// 2d, 3a, 3d, 4a, 4b, 4c, 5a, 5b, 5c, 5d
// fast paths:
// 3c, 4d

describe('PostgreSQL query generation functions for datetimes', function () {
  var doCallBack = function (transform, scope, done) {
    var expression = 'SELECT ' + postgresUtil.transformExpression("'2016-01-01T00:00:00.000Z'::timestamptz", 'datetime', transform) + ' AS result';

    utilPg.queryAndCallBack(expression, function (data) {
      scope.result = data.rows[0].result;
      done();
    });
  };

  describe('Transform for 1a datetime -> datetime', function () {
    beforeEach(function (done) {
      doCallBack(new DatetimeTransform({
        zone: 'ISO8601',
        transformedZone: 'ISO8601'
      }), this, done);
    });
    it(' without any change', function () {
      expect(this.result).toBe('2016-01-01 00:00:00+00');
    });
  });

  describe('Transform for 1a datetime -> datetime', function () {
    beforeEach(function (done) {
      doCallBack(new DatetimeTransform({
        zone: 'Europe/Amsterdam',
        transformedZone: 'ISO8601'
      }), this, done);
    });
    it(' with forcing input timezone', function () {
      expect(this.result).toBe('2015-12-31 23:00:00+00');
    });
  });

  describe('Transform for 1a datetime -> datetime', function () {
    beforeEach(function (done) {
      doCallBack(new DatetimeTransform({
        zone: 'ISO8601',
        transformedZone: 'Europe/Amsterdam'
      }), this, done);
    });
    it(' with changing timezone', function () {
      expect(this.result).toBe('2016-01-01 01:00:00');
    });
  });

  describe('Transform for 1a datetime -> datetime', function () {
    beforeEach(function (done) {
      doCallBack(new DatetimeTransform({
        zone: 'PST8PDT', // parse as
        transformedZone: 'Europe/Amsterdam' // transform to
      }), this, done);
    });
    it(' with setting and then changing timezone', function () {
      expect(this.result).toBe('2016-01-01 09:00:00');
    });
  });

  describe('Transform for 1b datetime -> duration', function () {
    beforeEach(function (done) {
      doCallBack(new DatetimeTransform({
        transformedZone: 'Europe/Amsterdam',
        transformedReference: '2010-01-01 01:00:00'
      }), this, done);
    });
    it('with reference time and timezone', function () {
      expect(this.result).toBe('P2191D');
    });
  });

  describe('Transform for 1c datetime -> continuous', function () {
    beforeEach(function (done) {
      doCallBack(new DatetimeTransform({
        transformedFormat: 'Day of Month  (1-31)'
      }), this, done);
    });
    it('by taking day of month', function () {
      expect(this.result).toEqual(1);
    });
  });

  describe('Transform for 1d datetime -> categorial', function () {
    beforeEach(function (done) {
      doCallBack(new DatetimeTransform({
        transformedFormat: 'Day of Week (Sunday-Saturday)'
      }), this, done);
    });
    it('by taking day of month', function () {
      expect(this.result).toEqual('Friday');
    });
  });
});

describe('PostgreSQL query generation functions for durations: ', function () {
  var doCallBack = function (transform, scope, done) {
    var expression = 'SELECT ' + postgresUtil.transformExpression("interval 'P10D'", 'duration', transform) + ' AS result';

    utilPg.queryAndCallBack(expression, function (data) {
      scope.result = data.rows[0].result;
      done();
    });
  };

  describe('Transform for 2a duration -> datetime', function () {
    beforeEach(function (done) {
      doCallBack(new DurationTransform({
        transformedReference: '2010-01-01T10:00:00+01'
      }), this, done);
    });
    it('by adding reference date', function () {
      expect(this.result).toEqual('2010-01-11 09:00:00+00');
    });
  });

  describe('Transform for 2a duration -> duration', function () {
    beforeEach(function (done) {
      doCallBack(new DurationTransform({
      }), this, done);
    });
    it('without change', function () {
      expect(this.result).toEqual('P10D');
    });
  });

  describe('Transform for 2a duration -> continuous', function () {
    beforeEach(function (done) {
      doCallBack(new DurationTransform({
        transformedUnits: 'days'
      }), this, done);
    });
    it('without change', function () {
      expect(this.result).toEqual(10);
    });
  });
});

/*
describe('PostgreSQL query generation functions for continuous: ', function () {
  var doCallBack = function (transform, scope, done) {
    var expression = 'SELECT ' + postgresUtil.transformExpression('10', 'continuous', transform) + ' AS result';

    utilPg.queryAndCallBack(expression, function (data) {
      scope.result = data.rows[0].result;
      done();
    });
  };
  // TODO
});

describe('PostgreSQL query generation functions for categorial: ', function () {
  var doCallBack = function (transform, scope, done) {
    var expression = 'SELECT ' + postgresUtil.transformExpression('tag', 'categorial', transform) + ' AS result';

    utilPg.queryAndCallBack(expression, function (data) {
      scope.result = data.rows[0].result;
      done();
    });
  };
  // TODO
});
*/
