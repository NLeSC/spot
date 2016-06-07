/**
 * Filter handling.
 * This module contains utility functions for setting and updating the widgets filters,
 * and for checking is a datapoint is selected.
 * This module is mainly used in onclick callbacks on the interactive charts.
 *
 * @module client/filters
 */
var misval = require('./misval');

/**
 * Update a categorial filter using the provided group, using the following rules:
 * A) none selected:
 *    add the group to the selection
 * B) one selected:
 *   The group is the same one as selected:
 *     invert the selection
 *   The group is a different one from the selected group:
 *     add the group to the selection
 * C) more than one selected:
 *   The group is in the selection:
 *     remove the group from the selection
 *   The group is not in the selection:
 *     add the group to the selection
 *
 * @param {string[]} filter - The currently selected groups
 * @param {Group} group - The group to add or remove from the filter
 * @param {Collection} - The collection of valid categories
 */
module.exports.categorial1DHandler = function categorial1DHandler (filters, group, categories) {
  // after add: if filters == categories, reset and dont filter
  var i = filters.indexOf(group);

  if (filters.length !== 1) {
    if (i > -1) {
      filters.splice(i, 1);
      return;
    }
  } else {
    if (i > -1) {
      filters.splice(0, filters.length);
      categories.forEach(function (f) {
        if (f.group !== group) {
          filters.push(f.group);
        }
      });
      return;
    }
  }
  // Add
  filters.push(group);

  // allow all => filter none
  if (filters.length === categories.length) {
    filters.splice(0, filters.length);
  }
};

/**
 * Update a continuous filter using the provided group, using the following rules:
 * A) no range selected
 *    set the range equal to that of the group
 * B) a range selected
 *    The group is outside the selection:
 *      extend the selection to include the group
 *    The group is inside the selection:
 *      move the endpoint closest to the group such that it excludes the group
 *
 * @param {number[]} filter - The currently selected groups as an interval [min,max]
 * @param {Group} group - The group to add or remove from the filter
 * @param {Object} [options] - The collection of valid categories
 * @param {boolean} [options.log = false] - Set to true if the scale is logarithmic
 */
module.exports.continuous1DHandler = function continuous1DHandler (filters, group, options) {
  options = options || {log: false};

  if (filters.length === 0) {
    // nothing selected, start a range
    filters[0] = group[0];
    filters[1] = group[1];
  } else if (group[0] >= filters[1]) {
    // clicked outside range
    filters[1] = group[1];
  } else if (group[1] <= filters[0]) {
    // clicked outside range
    filters[0] = group[0];
  } else {
    // clicked inside range
    var d1, d2;
    if (options.log) {
      d1 = Math.abs(Math.log(filters[0]) - Math.log(group[0]));
      d2 = Math.abs(Math.log(filters[1]) - Math.log(group[1]));
    } else {
      d1 = Math.abs(filters[0] - group[0]);
      d2 = Math.abs(filters[1] - group[1]);
    }
    if (d1 < d2) {
      filters[0] = group[0];
    } else {
      filters[1] = group[1];
    }
  }
};

/**
 * Set a categorial 1D filter function for a widget.
 *
 * @param {Widget} widget - The widget containing the 1D filter
 */
module.exports.categorial1D = function categorial1D (widget) {
  // Set of selected values
  var selection = widget.selection;

  if (selection.length === 0) {
    widget.filterFunction = function (d) {
      return true;
    };
  } else {
    var haystack = {};
    selection.forEach(function (h) {
      haystack[h] = true;
    });

    widget.filterFunction = function (d) {
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
};

/**
 * Set a continuous 1D filter function for a widget.
 *
 * @param {Widget} widget - The widget containing the 1D filter
 */
module.exports.continuous1D = function continuous1D (widget) {
  var min = widget.selection[0];
  var max = widget.selection[1];

  // dont filter when the filter is incomplete / malformed
  if (min === misval || max === misval || min === max) {
    widget.filterFunction = function (d) {
      return true;
    };
    return;
  }

  if (min > max) {
    var swap = min;
    min = max;
    max = swap;
  }

  // return true if domain[0] <= d <= domain[1]
  widget.filterFunction = function (d) {
    return (d >= min && d <= max && d !== misval);
  };
};

/**
 * Convenience function for determining if a specific value 'd' is selected
 *
 * @param {Widget} widget - The widget containing the 1D filter
 * @param {Object} d - Passed to the respective filter function
 * @returns {boolean} isSelected
 */
module.exports.isSelected = function isSelected (widget, d) {
  if (widget.filterFunction) {
    return widget.filterFunction(d);
  }
  return true;
};
