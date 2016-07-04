/**
 * Selections
 *
 * @class Selection
 */
var BaseModel = require('./base');
var misval = require('../misval');
var CategoryItems = require('./categoryitem-collection');

module.exports = BaseModel.extend({
  props: {
    /**
     * Depending on the type of selection, this can be an array of the selected categories,
     * or a numberic interval [start, end]
     * @memberof! Selection
     */
    selected: {
      type: 'array',
      required: true,
      default: function () {
        return [];
      }
    },
    /**
     * Type of selection, must be either categorial(or constant) or continuous
     * @memberof! Selection
     */
    type: {
      type: 'string',
      required: true,
      default: 'categorial',
      values: ['categorial', 'constant', 'continuous']
    },
    /**
     * Indicates if distances are treated logarithmically
     * @memberof! Selection
     */
    isLogScale: {
      type: 'boolean',
      required: true,
      default: false
    }
  },
  derived: {
    /**
     * A filter function based on the current widget and selection
     * @memberof! Selection
     */
    filterFunction: {
      deps: ['selected'],
      cache: false,
      fn: function () {
        if (this.type === 'categorial' || this.type === 'constant') {
          return filterFunctionCategorial1D.call(this);
        } else {
          return filterFunctionContinuous1D.call(this);
        }
      }
    }
  },
  collections: {
    categories: CategoryItems
  },
  /**
   * Update a selection with a given group or interval
   *
   * For categorial selections the following rules are used:
   * 1. none selected:
   *    add the group to the selection
   * 2. one selected and the group is the same:
   *    invert the selection
   * 3. one selected and the group is different:
   *    add the group to the selection
   * 4. more than one selected and the group is in the selection:
   *    remove the group from the selection
   * 5. more than one selected and the group is not in the selection:
   *    add the group to the selection
   *
   * For continuous selections the following rules are used:
   * 1. no range selected
   *    set the range equal to that of the group
   * 2. a range selected and the group is outside the selection:
   *    extend the selection to include the group
   * 3. a range selected and the group is inside the selection:
   *    set the endpoint closest to group to the group
   *
   * @memberof! Selection
   * @function
   * @param {(string|number[])} Group or interval
   */
  update: function (group) {
    if (this.type === 'categorial' || this.type === 'constant') {
      updateCategorial1D.call(this, group);
    } else if (this.type === 'continuous') {
      updateContinuous1D.call(this, group);
    }
  },
  /**
   * Clear the selection (ie. all points are selected),
   * @memberof! Selection
   * @function
   */
  reset: function () {
    this.selected.splice(0, this.selected.length);
  }
});

/*
 * @param {string} group - The group to add or remove from the filter
 */
function updateCategorial1D (group) {
  // after add: if filters == categories, reset and dont filter
  var selected = this.selected;
  var categories = this.categories;
  var i = selected.indexOf(group);

  if (selected.length !== 1) {
    if (i > -1) {
      selected.splice(i, 1);
      return;
    }
  } else {
    if (i > -1) {
      selected.splice(0, selected.length);
      categories.forEach(function (f) {
        if (f.group !== group) {
          selected.push(f.group);
        }
      });
      return;
    }
  }
  // Add
  selected.push(group);

  // allow all => filter none
  if (selected.length === categories.length) {
    selected.splice(0, selected.length);
  }
}

/*
 * @param {number[]} interval - The interval to add or remove from the filter as an interval [s,e]
 */
function updateContinuous1D (interval) {
  var selected = this.selected;

  if (selected.length === 0) {
    // nothing selected, start a range
    selected[0] = interval[0];
    selected[1] = interval[1];
  } else if (interval[0] >= selected[1]) {
    // clicked outside selection
    selected[1] = interval[1];
  } else if (interval[1] <= selected[0]) {
    // clicked outside selection
    selected[0] = interval[0];
  } else {
    // clicked inside selection
    var d1, d2;
    if (this.isLogScale) {
      d1 = Math.abs(Math.log(selected[0]) - Math.log(interval[0]));
      d2 = Math.abs(Math.log(selected[1]) - Math.log(interval[1]));
    } else {
      d1 = Math.abs(selected[0] - interval[0]);
      d2 = Math.abs(selected[1] - interval[1]);
    }
    if (d1 < d2) {
      selected[0] = interval[0];
    } else {
      selected[1] = interval[1];
    }
  }
}

/*
 * Set a categorial 1D filter function
 */
function filterFunctionCategorial1D () {
  if (this.selected.length === 0) {
    return function (d) {
      return true;
    };
  } else {
    var haystack = {};
    this.selected.forEach(function (h) {
      haystack[h] = true;
    });

    return function (d) {
      var needle = d;
      if (!(needle instanceof Array)) {
        needle = [d];
      }

      var selected = false;
      needle.forEach(function (s) {
        selected = selected | haystack[s];
      });
      return selected;
    };
  }
}

/*
 * Set a continuous 1D filter function
 */
function filterFunctionContinuous1D () {
  if (!this.selected || !this.selected.length) {
    return function (d) {
      return true;
    };
  }

  var min = this.selected[0];
  var max = this.selected[1];

  // return true if min <= d <= max
  return function (d) {
    return (d >= min && d <= max && d !== misval);
  };
}
