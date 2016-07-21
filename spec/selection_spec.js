/* eslint-env jasmine */
var Selection = require('../client/models/selection');
var Group = require('../client/models/group');

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
  });
});
