/**
 * Utility functions for crossfilter datasets
 * @module client/util-crossfilter
 */

/** Crossfilter instance, see http://square.github.io/crossfilter/ */
var crossfilter = require('crossfilter');
module.exports.crossfilter = crossfilter([]);

/**
 * @typedef {Object} SubgroupValue
 * @property {number} count The count of the number of elements in this subgroup
 * @property {number} sum The sum of all elements in this subgroup
 */

/**
 * @typedef {Object.<string, SubgroupValue>} SubgroupHash
 */

/**
 * @typedef {Object[]} UnpackedGroups
 * @property {string} key The group key
 * @property {SubgroupHash} value Hash containing subgroups
 */

/**
 * crossfilter dimensions are implemented as arrays for categorial facets,
 * to implement multiple labels/tags per datapoint.
 * This can result in quite messy datastructure returned by group.all()
 * This function re-formats the data to be more regular
 * @param {Object[]} groups - Array of crossfilter groups to unpack
 * @param {(string|string[])} groups.key - The group key as a string or array of strings
 * @param {SubgroupHash} groups.value - A hash mapping subgroup keys on subgroup values
 * @returns {UnpackedGroups} newGroups - Unpacked array of groups
 */
module.exports.unpackArray = function unpackArray (groups) {
  function merge (key, values) {
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
  }

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
};

// TODO: cummulative sums
/**
 * Returns a function that further reduces the crossfilter group
 * to a single value, depending on sum/count/average settings of facet
 * @param {Facet} facet - The facet for which to create the reduction function
 * @returns {(subgroupSum|subgroupCount|subgroupAverage)} The required reduction function
 */
module.exports.reduceFn = function reduceFn (facet) {
  if (facet.reduceSum) {
    /**
     * @callback subgroupSum
     * @param {SubgroupValue} d
     * @returns {number} sum
     */
    return function (d) {
      return d.sum;
    };
  } else if (facet.reduceCount) {
    /**
     * @callback subgroupCount
     * @param {SubgroupValue} d
     * @returns {number} count
     */
    return function (d) {
      return d.count;
    };
  } else if (facet.reduceAverage) {
    /**
     * @callback subgroupAverage
     * @param {SubgroupValue} d
     * @returns {number} d.sum/d.count
     */
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
};
