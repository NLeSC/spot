/* eslint-env jasmine */
var moment = require('moment-timezone');

var Partition = require('../partition');
var Group = require('../partition/group');

describe('The selection module', function () {
  it('should provide a continuous selection', function () {
    var p = new Partition({type: 'continuous', minval: 0, maxval: 10});
    expect(p.type).toBe('continuous');

    // Filterfunction without selection
    p.updateSelection();
    expect(p.filterFunction()(-10)).toBe(false);
    expect(p.filterFunction()(0)).toBe(true);
    expect(p.filterFunction()(1)).toBe(true);
    expect(p.filterFunction()(2)).toBe(true);
    expect(p.filterFunction()(10)).toBe(true);
    expect(p.filterFunction()(100)).toBe(false);

    // Update a continuous filter using the provided group, using the following rules:
    // A) no range selected
    //    set the range equal to that of the group
    p.updateSelection(new Group({min: 1, max: 2}));
    expect(p.selected).toEqual([1, 2]);

    // B) a range selected
    //    The group is outside the selection:
    //      extend the selection to include the group
    p.updateSelection(new Group({min: 4, max: 5})); // extend to the right
    expect(p.selected).toEqual([1, 5]);

    p.updateSelection(new Group({min: 0, max: 1})); // extend to the left
    expect(p.selected).toEqual([0, 5]);

    //    The group is inside the selection:
    //      set the endpoint closest to group to the group
    p.updateSelection(new Group({min: 1, max: 2})); // from the left
    expect(p.selected).toEqual([1, 5]);

    p.updateSelection(new Group({min: 3, max: 4})); // from the left
    expect(p.selected).toEqual([1, 4]);

    // Filterfunction with selection
    expect(p.filterFunction()(0)).toBe(false);
    expect(p.filterFunction()(1)).toBe(true);
    expect(p.filterFunction()(2)).toBe(true);
    expect(p.filterFunction()(100)).toBe(false);

    // and for logarithmic scales
    p = new Partition({
      type: 'continuous',
      minval: 1e1,
      maxval: 1e4,
      groupingContinuous: 'log'
    });

    p.updateSelection(new Group({min: 1e1, max: 1e4})); // init
    expect(p.selected).toEqual([1e1, 1e4]);

    p.updateSelection(new Group({min: 1e0, max: 1e1})); // extend left
    expect(p.selected).toEqual([1e0, 1e4]);

    p.updateSelection(new Group({min: 1e4, max: 1e5})); // extend right
    expect(p.selected).toEqual([1e0, 1e5]);

    p.updateSelection(new Group({min: 1e1, max: 1e2})); // shrink left
    expect(p.selected).toEqual([1e1, 1e5]);

    p.updateSelection(new Group({min: 1e3, max: 1e4})); // shrink right
    expect(p.selected).toEqual([1e1, 1e4]);

    // Filter function with selection
    var f = p.filterFunction();
    expect(f(0.1)).toBe(false);
    expect(f(10)).toBe(true);
    expect(f(100)).toBe(true);
    expect(f(10000)).toBe(true);
    expect(f(10001)).toBe(false);
  });

  it('should provide a categorial Selection', function () {
    var p = new Partition({
      type: 'categorial',
      groups: [
        {value: 'zero'},
        {value: 'one'},
        {value: 'two'},
        {value: 'three'}
      ]
    });

    // Update a categorial filter using the provided group, using the following rules:
    // A) none selected:
    //    add the group to the selection
    p.updateSelection(new Group({value: 'one'}));
    expect(p.selected).toEqual(['one']);

    // B) one selected:
    //   The group is the same one as selected:
    //     invert the selection
    p.updateSelection(new Group({value: 'one'}));
    expect(p.selected).toEqual(['three', 'two', 'zero']);

    //   The group is a different one from the selected group:
    //     add the group to the selection
    p.selected = ['one'];
    p.updateSelection(new Group({value: 'two'}));
    expect(p.selected).toEqual(['one', 'two']);

    // C) more than one selected:
    //   The group is in the selection:
    //     remove the group from the selection
    p.updateSelection(new Group({value: 'two'}));
    expect(p.selected).toEqual(['one']);

    //   The group is not in the selection:
    //     add the group to the selection
    p.updateSelection(new Group({value: 'two'}));
    p.updateSelection(new Group({value: 'three'}));
    expect(p.selected).toEqual(['one', 'two', 'three']);

    //   and corner case speedup, if p.selected == categories, reset
    p.selected = ['one', 'two', 'three'];
    p.updateSelection(new Group({value: 'zero'}));
    expect(p.selected).toEqual([]);

    p.selected = ['one', 'two', 'three'];
    var f = p.filterFunction();
    expect(f('one')).toBe(true);
    expect(f('two')).toBe(true);
    expect(f('three')).toBe(true);
    expect(f('four')).toBe(false);
    expect(f('five')).toBe(false);
  });

  it('should provide a datetime Selection', function () {
    var p = new Partition({
      minval: moment('2015-03-01 00:00'),
      maxval: moment('2018-01-01 00:00'),
      type: 'datetime'
    });
    expect(p.type).toBe('datetime');

    // Filterfunction without selection
    var f = p.filterFunction();
    expect(f(moment('2015-01-01 00:00'))).toBe(false);
    expect(f(moment('2015-03-01 00:00'))).toBe(true);
    expect(f(moment('2015-04-03 15:30'))).toBe(true);
    expect(f(moment('2018-01-01 00:00'))).toBe(true);
    expect(f(moment('2019-01-01 00:00'))).toBe(false);

    // Update a datetime filter using the provided group, using the following rules:
    // A) no range selected
    //    set the range equal to that of the group
    p.updateSelection(new Group({
      min: '2016-01-01 00:00',
      max: '2017-01-01 00:00'
    }));
    expect(p.selected).toEqual(['2016-01-01 00:00', '2017-01-01 00:00']);

    // B) a range selected
    //    The group is outside the selection:
    //      extend the selection to include the group
    p.updateSelection(new Group({min: '2017-01-01 00:00', max: '2017-01-01 12:00'})); // extend to the right
    expect(p.selected).toEqual(['2016-01-01 00:00', '2017-01-01 12:00']);

    p.updateSelection(new Group({min: '2015-01-01 00:00', max: '2016-01-01 00:00'})); // extend to the left
    expect(p.selected).toEqual(['2015-01-01 00:00', '2017-01-01 12:00']);

    //    The group is inside the selection:
    //      set the endpoint closest to group to the group
    p.updateSelection(new Group({min: '2015-02-01 00:00', max: '2015-03-01 00:00'})); // from the left
    expect(p.selected).toEqual(['2015-03-01 00:00', '2017-01-01 12:00']);

    p.updateSelection(new Group({min: '2016-01-01 00:00', max: '2017-01-01 04:00'})); // from the right
    expect(p.selected).toEqual(['2015-03-01 00:00', '2016-01-01 00:00']);

    // Filterfunction with selection
    f = p.filterFunction();
    expect(f(moment('2015-01-01 00:00'))).toBe(false);
    expect(f(moment('2015-03-01 00:00'))).toBe(true);
    expect(f(moment('2015-04-03 15:30'))).toBe(true);
    expect(f(moment('2016-01-01 00:00'))).toBe(false);
    expect(f(moment('2018-01-01 00:00'))).toBe(false);
  });
});
