/* eslint-env jasmine */
var moment = require('moment-timezone');

// TODO: a selection depends on its groups.., which are actually managed by a facet, ie. a subclass
var Selection = require('../client/models/selection');
var Group = require('../client/models/group');
var Groups = require('../client/models/group-collection');

describe('The selection module', function () {
  it('should provide a continuous Selection', function () {
    var s = new Selection({type: 'continuous'});
    expect(s.type).toBe('continuous');

    // Update a continuous filter using the provided group, using the following rules:
    // A) no range selected
    //    set the range equal to that of the group
    s.update(new Group({min: 1, max: 2}));
    expect(s.selected).toEqual([1, 2]);

    // B) a range selected
    //    The group is outside the selection:
    //      extend the selection to include the group
    s.update(new Group({min: 4, max: 5})); // extend to the right
    expect(s.selected).toEqual([1, 5]);

    s.update(new Group({min: 0, max: 1})); // extend to the left
    expect(s.selected).toEqual([0, 5]);

    //    The group is inside the selection:
    //      set the endpoint closest to group to the group
    s.update(new Group({min: 1, max: 2})); // from the left
    expect(s.selected).toEqual([1, 5]);

    s.update(new Group({min: 3, max: 4})); // from the left
    expect(s.selected).toEqual([1, 4]);

    // and for logarithmic scales
    s = new Selection({
      type: 'continuous',
      isLogScale: true
    });

    s.update(new Group({min: 1e1, max: 1e4})); // init
    expect(s.selected).toEqual([1e1, 1e4]);

    s.update(new Group({min: 1e0, max: 1e1})); // extend left
    expect(s.selected).toEqual([1e0, 1e4]);

    s.update(new Group({min: 1e4, max: 1e5})); // extend right
    expect(s.selected).toEqual([1e0, 1e5]);

    s.update(new Group({min: 1e1, max: 1e2})); // shrink left
    expect(s.selected).toEqual([1e1, 1e5]);

    s.update(new Group({min: 1e3, max: 1e4})); // shrink right
    expect(s.selected).toEqual([1e1, 1e4]);

    // needed to make full interval include both min and max values
    s.groups = new Groups({min: 1e1, max: 1e4});

    var f = s.filterFunction;
    expect(f(0.1)).toBe(false);
    expect(f(10)).toBe(true);
    expect(f(100)).toBe(true);
    expect(f(10000)).toBe(true);
    expect(f(10001)).toBe(false);
  });

  it('should provide a categorial Selection', function () {
    var s = new Selection({
      type: 'categorial',
      isLogScale: false,
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
    s.update(new Group({value: 'one'}));
    expect(s.selected).toEqual(['one']);

    // B) one selected:
    //   The group is the same one as selected:
    //     invert the selection
    s.update(new Group({value: 'one'}));
    expect(s.selected).toEqual(['zero', 'two', 'three']);

    //   The group is a different one from the selected group:
    //     add the group to the selection
    s.selected = ['one'];
    s.update(new Group({value: 'two'}));
    expect(s.selected).toEqual(['one', 'two']);

    // C) more than one selected:
    //   The group is in the selection:
    //     remove the group from the selection
    s.update(new Group({value: 'two'}));
    expect(s.selected).toEqual(['one']);

    //   The group is not in the selection:
    //     add the group to the selection
    s.update(new Group({value: 'two'}));
    s.update(new Group({value: 'three'}));
    expect(s.selected).toEqual(['one', 'two', 'three']);

    //   and corner case speedup, if s.selected == categories, reset
    s.selected = ['one', 'two', 'three'];
    s.update(new Group({value: 'zero'}));
    expect(s.selected).toEqual([]);

    s.selected = ['one', 'two', 'three'];
    var f = s.filterFunction;
    expect(f('one')).toBe(true);
    expect(f('two')).toBe(true);
    expect(f('three')).toBe(true);
    expect(f('four')).toBe(false);
    expect(f('five')).toBe(false);
  });

  it('should provide a datetime Selection', function () {
    var s = new Selection({type: 'datetime'});
    expect(s.type).toBe('datetime');

    // Update a datetime filter using the provided group, using the following rules:
    // A) no range selected
    //    set the range equal to that of the group
    s.update(new Group({
      min: '2016-01-01 00:00',
      max: '2017-01-01 00:00'
    }));
    expect(s.selected).toEqual(['2016-01-01 00:00', '2017-01-01 00:00']);

    // B) a range selected
    //    The group is outside the selection:
    //      extend the selection to include the group
    s.update(new Group({min: '2017-01-01 00:00', max: '2017-01-01 12:00'})); // extend to the right
    expect(s.selected).toEqual(['2016-01-01 00:00', '2017-01-01 12:00']);

    s.update(new Group({min: '2015-01-01 00:00', max: '2016-01-01 00:00'})); // extend to the left
    expect(s.selected).toEqual(['2015-01-01 00:00', '2017-01-01 12:00']);

    //    The group is inside the selection:
    //      set the endpoint closest to group to the group
    s.update(new Group({min: '2015-02-01 00:00', max: '2015-03-01 00:00'})); // from the left
    expect(s.selected).toEqual(['2015-03-01 00:00', '2017-01-01 12:00']);

    s.update(new Group({min: '2016-01-01 00:00', max: '2017-01-01 04:00'})); // from the right
    expect(s.selected).toEqual(['2015-03-01 00:00', '2016-01-01 00:00']);

    // needed to make full interval include both min and max values
    s.groups = new Groups({min: moment('2015-03-01 00:00'), max: moment('2016-01-01 00:00')});

    var f = s.filterFunction;
    expect(f(moment('2015-01-01 00:00'))).toBe(false);
    expect(f(moment('2015-03-01 00:00'))).toBe(true);
    expect(f(moment('2015-04-03 15:30'))).toBe(true);
    expect(f(moment('2016-01-01 00:00'))).toBe(true);
    expect(f(moment('2017-01-01 00:00'))).toBe(false);
  });
});
