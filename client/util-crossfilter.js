// ********************************************
// Utility functions for crossfilter datasets
// ********************************************

var crossfilter = require('crossfilter');

// crossfilter dimensions are arrays for categorial facets,
// to implement multiple labels/tags per datapoint.
// This can result in quite messy datastructure returned by group.all()
// This function re-formats the data to be more regular
function unpackArray (groups) {
  // values := {count: 0, sum: 0}
  // key: {'a':{count: 0, sum 0}, 'b':{count: 0, sum 0} }
  var merge = function (key, values) {
    Object.keys(values).forEach(function (subgroup) {
      if (newKeys[key]) {
        newKeys[key][subgroup] = newKeys[key][subgroup] || {count: 0, sum: 0};
        newKeys[key][subgroup].count += values[subgroup].count;
        newKeys[key][subgroup].sum += values[subgroup].sum;
      } else {
        newKeys[key] = {};
        newKeys[key][subgroup] = {count: values[subgroup].count, sum: values[subgroup].sum};
      }
    });
  };

  var newKeys = {};
  groups.forEach(function (group) {
    if (group.key instanceof Array) {
      group.key.forEach(function (subkey) {
        merge(subkey, group.value);
      });
    } else {
      merge(group.key, group.value);
    }
  });

  var newGroups = [];
  Object.keys(newKeys).forEach(function (key) {
    newGroups.push({key: key, value: newKeys[key]});
  });

  return newGroups;
}

// Returns a function that further reduces the crossfilter group
// to a single value, depending on sum/count/average settings of facet
// returns function(d) => c, where d := { sum: ..., count: ... }
// FIXME: cummulative sums
function reduceFn (facet) {
  if (facet.reduceSum) {
    return function (d) {
      return d.sum;
    };
  } else if (facet.reduceCount) {
    return function (d) {
      return d.count;
    };
  } else if (facet.reduceAverage) {
    return function (d) {
      if (d.count > 0) {
        return d.sum / d.count;
      } else {
        return 0.0;
      }
    };
  } else {
    console.error('Reduction not implemented for this facet', facet);
  }
  return null;
}

module.exports = {
  crossfilter: crossfilter([]),
  unpackArray: unpackArray,
  reduceFn: reduceFn
};
