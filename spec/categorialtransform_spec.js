/* eslint-env jasmine */
var CategorialRule = require('../client/models/categorial-rule');
var CategorialTransform = require('../client/models/categorial-transform');
var misval = require('../client/misval');

describe('The categorial-rule', function () {
  it('should do direct string matching', function () {
    var rule = new CategorialRule({
      expression: 'hello world',
      group: 'one'
    });

    expect(rule.match('hello world')).toEqual('one');
    expect(rule.match('world')).toBe(false);
  });
  it('should do regular expression matching', function () {
    var rule = new CategorialRule({
      expression: '/world/',
      group: 'two'
    });
    expect(rule.match('hello world again')).toEqual('two');
    expect(rule.match('World')).toBe(false);
  });
  it('should do regular expression matching with flags', function () {
    var rule = new CategorialRule({
      expression: '/world/i',
      group: 'three'
    });
    expect(rule.match('hello WORLD again')).toEqual('three');
    expect(rule.match('no match')).toBe(false);
  });
  // it('should do regular expression matching with replacement', function () {
  //   var rule = new CategorialRule({
  //     expression: '/^ignored text (.*)$/',
  //     group: 'interesting part is $1'
  //   });
  //   expect(rule.match('ignored text matched')).toEqual('interesting part is matched');
  //   expect(rule.match('ignored matched text')).toEqual(false);
  // });
});

describe('The categorial-transform', function () {
  var transform = new CategorialTransform([
    {
      expression: 'hello world',
      group: 'one'
    },
    {
      expression: '/you/i',
      group: 'two'
    }
  ]);
  it('should do multi rule matching', function () {
    expect(transform.transform('hello world')).toEqual('one');
    expect(transform.transform('there you are')).toEqual('two');
  });
  it('should default to Other', function () {
    expect(transform.transform('this will not be matched')).toEqual('Other');
  });
  it('should deal with missing data', function () {
    expect(transform.transform(misval)).toEqual('Other');
  });
});
