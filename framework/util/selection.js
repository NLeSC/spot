/**
 * Selection
 * @module client/util-selection
 */
var misval = require('./misval');
var moment = require('moment-timezone');

/*
 * Set a categorial 1D filter function
 * @param {Partition} partition
 */
function filterFunctionCategorial1D (partition) {
  var haystack = {};

  if (!partition.selected || !partition.selected.length) {
    partition.groups.forEach(function (group) {
      haystack[group.value] = true;
    });
  } else {
    partition.selected.forEach(function (h) {
      haystack[h] = true;
    });
  }

  return function (d) {
    var needle = d;
    if (!(needle instanceof Array)) {
      needle = [d];
    }

    var selected = false;
    needle.forEach(function (s) {
      selected = selected | haystack[s];
    });
    return !!selected;
  };
}

/*
 * Set a text filter function
 * @param {Partition} partition
 */
function filterFunctionText (partition) {
  var haystack = {};

  // nothing selected, so all selected
  if (partition.selected.length === 0) {
    return function () {
      return true;
    };
  }

  partition.selected.forEach(function (h) {
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
    return !!selected;
  };
}

/*
 * Set a continuous 1D filter function
 * @param {Partition} partition
 */
function filterFunctionContinuous1D (partition) {
  var edge = partition.maxval;
  var min;
  var max;

  if (!partition.selected || !partition.selected.length) {
    min = partition.minval;
    max = partition.maxval;
    return function (d) {
      return ((d >= min && d <= max) && (d !== misval));
    };
  } else {
    min = partition.selected[0];
    max = partition.selected[1];
    return function (d) {
      return ((d >= min && d < max) || ((d === edge) && (max === edge))) && (d !== misval);
    };
  }
}

/*
 * Set a continuous 1D filter function on a datetime dimension
 * @param {Partition} partition
 */
function filterFunctionDatetime1D (partition) {
  var edge = moment(partition.maxval);
  var min;
  var max;

  if (!partition.selected || !partition.selected.length) {
    min = moment(partition.minval);
    max = moment(partition.maxval);

    return function (d) {
      var m = moment(d);
      return (m !== misval) && !m.isBefore(min) && !m.isAfter(max);
    };
  } else {
    min = moment(partition.selected[0]);
    max = moment(partition.selected[1]);
    return function (d) {
      var m = moment(d);
      return (m !== misval) && !min.isAfter(m) && (m.isBefore(max) || (max.isSame(edge) && max.isSame(m)));
    };
  }
}

/*
 * Set a continuous 1D filter function on a duration dimension
 * @param {Partition} partition
 */
function filterFunctionDuration1D (partition) {
  var edge = partition.maxval;
  var min;
  var max;

  if (!partition.selected || !partition.selected.length) {
    min = partition.minval;
    max = partition.maxval;

    return function (d) {
      if (d === misval) {
        return false;
      }
      var m = moment.duration(d);
      return moment.isDuration(m) && m >= min && m <= max;
    };
  } else {
    min = moment.duration(partition.selected[0]);
    max = moment.duration(partition.selected[1]);
    return function (d) {
      if (d === misval) {
        return false;
      }
      var m = moment.duration(d);
      return moment.isDuration(m) && m >= min && (m < max || (m <= max && max >= edge));
    };
  }
}

/**
 * A filter function based for a single partition
 * @function
 * @returns {boolean} selected True if the datapoint is currently selected
 * @param {Partition} partition
 * @param {Object} datapoint
 * @memberof! Selection
 */
function filterFunction (partition) {
  if (partition.isCategorial || partition.isConstant) {
    return filterFunctionCategorial1D(partition);
  } else if (partition.isContinuous) {
    return filterFunctionContinuous1D(partition);
  } else if (partition.isDatetime) {
    return filterFunctionDatetime1D(partition);
  } else if (partition.isDuration) {
    return filterFunctionDuration1D(partition);
  } else if (partition.isText) {
    return filterFunctionText(partition);
  } else {
    console.error('Cannot make filterfunction for partition', partition);
  }
}

/*
 * @param {Group} group - The group to add or remove from the filter
 */
function updateCategorial1D (partition, group) {
  var selected = partition.selected;

  if (selected.length === 0) {
    // 1. none selected:
    selected.push(group.value);
  } else if (selected.length === 1) {
    if (selected[0] === group.value) {
      // 2. one selected and the group is the same:
      selected.splice(0, selected.length);
      partition.groups.forEach(function (g) {
        if (g.value !== group.value) {
          selected.push(g.value);
        }
      });
    } else {
      // 3. one selected and the group is different:
      selected.push(group.value);
    }
  } else {
    var i;
    i = selected.indexOf(group.value);
    if (i > -1) {
      // 4. more than one selected and the group is in the selection:
      selected.splice(i, 1);
    } else {
      // 5. more than one selected and the group is not in the selection:
      selected.push(group.value);
    }
  }

  // after add: if filters == groups, reset and dont filter
  if (selected.length === partition.groups.length) {
    selected.splice(0, selected.length);
  }
}

/*
 * @param {Group} group - The group to add or remove from the filter
 */
function updateText (partition, group) {
  var selected = partition.selected;

  var i;
  i = selected.indexOf(group.value);
  if (i > -1) {
    // 1. in the selection, remove it
    selected.splice(i, 1);
  } else {
    // 2. not in the selection, add it
    selected.push(group.value);
  }
}

/*
 * @param {Group} group - The group to add or remove from the filter
 */
function updateContinuous1D (partition, group) {
  var selected = partition.selected;

  if (selected.length === 0) {
    // nothing selected, start a range
    selected[0] = group.min;
    selected[1] = group.max;
  } else if (group.min >= selected[1]) {
    // clicked outside to the rigth of selection
    selected[1] = group.max;
  } else if (group.max <= selected[0]) {
    // clicked outside to the left of selection
    selected[0] = group.min;
  } else {
    // clicked inside selection
    var d1, d2;
    if (partition.groupLog) {
      d1 = Math.abs(Math.log(selected[0]) - Math.log(group.min));
      d2 = Math.abs(Math.log(selected[1]) - Math.log(group.max));
    } else {
      d1 = Math.abs(selected[0] - group.min);
      d2 = Math.abs(selected[1] - group.max);
    }
    if (d1 < d2) {
      selected[0] = group.min;
    } else {
      selected[1] = group.max;
    }
  }
}

/*
 * @param {Group} group - The group to add or remove from the filter
 */
function updateDatetime1D (partition, group) {
  var selected = partition.selected;

  if (!selected || selected.length === 0) {
    // nothing selected, start a range
    selected[0] = group.min.toISOString();
    selected[1] = group.max.toISOString();
    return;
  }

  var selectionStart = moment(selected[0]);
  var selectionEnd = moment(selected[1]);

  if (!group.min.isBefore(selectionEnd)) {
    // clicked outside to the rigth of selection
    selected[1] = group.max.toISOString();
  } else if (!group.max.isAfter(selectionStart)) {
    // clicked outside to the left of selection
    selected[0] = group.min.toISOString();
  } else {
    // clicked inside selection
    var d1, d2;
    d1 = Math.abs(selectionStart.diff(group.min));
    d2 = Math.abs(selectionEnd.diff(group.max));

    if (d1 < d2) {
      selected[0] = group.max.toISOString();
    } else {
      selected[1] = group.min.toISOString();
    }
  }
}

/*
 * @param {Group} group - The group to add or remove from the filter
 */
function updateDuration1D (partition, group) {
  var selected = partition.selected;

  if (selected.length === 0) {
    // nothing selected, start a range
    selected[0] = group.min.toISOString();
    selected[1] = group.max.toISOString();
    return;
  }

  var selectionStart = moment.duration(selected[0]);
  var selectionEnd = moment.duration(selected[1]);

  if (group.min >= selectionEnd) {
    // clicked outside to the rigth of selection
    selected[1] = group.max.toISOString();
  } else if (group.max <= selectionStart) {
    // clicked outside to the left of selection
    selected[0] = group.min.toISOString();
  } else {
    // clicked inside selection
    var d1, d2;
    d1 = Math.abs(selectionStart - group.min);
    d2 = Math.abs(selectionEnd - group.max);

    if (d1 < d2) {
      selected[0] = group.max.toISOString();
    } else {
      selected[1] = group.min.toISOString();
    }
  }
}

/**
 * Update the selection with a given group or interval
 * or, if no group is given, clear the selection.
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
 *    set the endpoint closest to the group to that of the group
 *
 * @function
 * @param {Partition} Partition to update
 * @param {(string|number[])} Group or interval
 */
function updateSelection (partition, group) {
  if (!group) {
    // Clear the selection (ie. all points are selected)
    partition.selected.splice(0, partition.selected.length);
  } else {
    // Update the selection
    if (partition.type === 'categorial' || partition.type === 'constant') {
      updateCategorial1D(partition, group);
    } else if (partition.type === 'continuous') {
      updateContinuous1D(partition, group);
    } else if (partition.type === 'datetime') {
      updateDatetime1D(partition, group);
    } else if (partition.type === 'duration') {
      updateDuration1D(partition, group);
    } else if (partition.type === 'text') {
      updateText(partition, group);
    } else {
      console.error('Cannot update selection', partition.type);
    }
  }
}

module.exports = {
  filterFunction: filterFunction,
  updateSelection: updateSelection
};
