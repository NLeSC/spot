/**
 * Utility functions for crossfilter datasets
 * We roughly follow the crossfilter design of dimensions and groups, but we
 * add an extra step to allow transformations on the data.
 * 1. a datum is turned into a base value using baseValFn;
 * 2. a base value is transformed into a value (possbily using exceedances,
 *    percentiles, category remapping etc.) using valueFn;
 * 3. a value is grouped using groupFn.
 *
 * @module client/util-crossfilter
 * @see baseValueFn, valueFn, groupFn
 */
var misval = require('./misval');
var moment = require('moment-timezone');
var app = require('ampersand-app');

/**
 * @typedef {Object} SubgroupValue
 * @property {number} count The count of the number of elements in this subgroup
 * @property {number} sum The sum of all elements in this subgroup
 */

// TODO: cummulative sums
/**
 * Reduce a SubgroupValue to a single number
 *
 * @callback reduceCB
 * @param {SubgroupValue} d SubgroupValue
 * @returns {number} Reduced value
 */
/**

/**
 * Returns a function for further reducing the crossfilter group
 * to a single value, depending on sum/count/average settings of
 * the Aggregate class.
 * @param {Aggregate} facet - The Aggregate class for which to create the reduction function
 * @returns {cb} The required reduction function
 */
function reduceFn (aggregate) {
  if (aggregate.doSum) {
    /**
     * @callback subgroupSum
     * @param {SubgroupValue} d
     * @returns {number} sum
     */
    return function (d) {
      return d.sum;
    };
  } else if (aggregate.doCount) {
    /**
     * @callback subgroupCount
     * @param {SubgroupValue} d
     * @returns {number} count
     */
    return function (d) {
      return d.count;
    };
  } else if (aggregate.doAverage) {
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
    console.error('Operation not implemented for this Aggregate', aggregate);
  }
  return null;
}

// ********************************************************
// Facet transform utility function
// ********************************************************

/**
 * Returns the base value for a datum
 *
 * @callback baseValueCB
 * @param {Object} d Raw data record
 * @returns {Object} base value
 */

/**
 * Base value for given facet
 * @param {Facet} facet
 * @returns {baseValueCB} Base value function for this facet
 */
function baseValueFn (facet) {
  var accessor;

  // Array dimensions have a [] appended to the accessor,
  // remove it to get to the actual accessor
  var path = facet.accessor;
  if (path.match(/\[\]$/)) {
    path = path.substring(0, path.length - 2);
  }

  // Nested properties can be accessed in javascript via the '.'
  // so we implement it the same way here.
  path = path.split('.');

  if (path.length === 1) {
    // Use a simple direct accessor, as it is probably faster than the more general case
    // and it was implemented already
    accessor = function (d) {
      var value = misval;
      if (d.hasOwnProperty(path[0])) {
        value = d[path[0]];
        if (facet.misval.indexOf(value) > -1 || value === null) {
          value = misval;
        }
      }

      return value;
    };
  } else {
    // Recursively follow the crumbs to the desired property
    accessor = function (d) {
      var i = 0;
      var value = d;

      for (i = 0; i < path.length; i++) {
        if (value && value.hasOwnProperty(path[i])) {
          value = value[path[i]];
        } else {
          value = misval;
          break;
        }
      }

      if (facet.misval.indexOf(value) > -1 || value === null) {
        value = misval;
      }
      return value;
    };
  }

  return accessor;
}

/**
 * Returns the transformed value from a base value
 *
 * @callback valueCB
 * @param {Object} d Base value
 * @returns {Object} Transformed value
 */

/**
 * Create a function that returns the transformed value for this facet
 * @param {Facet} facet
 * @returns {valueCB} Value function for this facet
 */
function valueFn (facet) {
  if (facet.isConstant) {
    return function () { return '1'; };
  } else if (facet.isContinuous) {
    return continuousValueFn(facet);
  } else if (facet.isCategorial) {
    return categorialValueFn(facet);
  } else if (facet.isTimeOrDuration) {
    return timeValueFn(facet);
  } else {
    console.error('facetValueFn not implemented for facet type: ', facet);
  }
}

function continuousValueFn (facet) {
  // get base value function
  var baseValFn = baseValueFn(facet);

  // do we have a continuous transform?
  if (facet.continuousTransform && facet.continuousTransform.length > 0) {
    // yes, use it
    return function (d) {
      var val = facet.continuousTransform.transform(parseFloat(baseValFn(d)));
      if (isNaN(val) || val === Infinity || val === -Infinity) {
        return misval;
      }
      return val;
    };
  } else {
    // no, just parse numeric value from base value
    return function (d) {
      var val = parseFloat(baseValFn(d));
      if (isNaN(val) || val === Infinity || val === -Infinity) {
        return misval;
      }
      return val;
    };
  }
}

function categorialValueFn (facet) {
  // get base value function
  var baseValFn = baseValueFn(facet);

  if (facet.categorialTransform && facet.categorialTransform.length > 0) {
    return function (d) {
      var vals = baseValFn(d);
      if (!(vals instanceof Array)) {
        vals = [vals];
      }
      vals.forEach(function (val, i) {
        vals[i] = facet.categorialTransform.transform(val);
      });
      return vals;
    };
  } else {
    return function (d) {
      return baseValFn(d);
    };
  }
}

function timeValueFn (facet) {
  // get base value function
  var baseValFn = baseValueFn(facet);
  var timeTransform = facet.timeTransform;

  if (facet.timeTransform.isDuration) {
    /**
     * Duration parsing:
     * 1. If no format is given, the string parsed using
     *    the [ISO 8601 standard](https://en.wikipedia.org/wiki/ISO_8601)
     * 2. If a format is given, the string is parsed as float and interpreted in the given units
     **/
    var durationFormat = facet.timeTransform.format;
    if (durationFormat) {
      return function (d) {
        var value = baseValFn(d);
        if (value !== misval) {
          var m = moment.duration(parseFloat(value), durationFormat);
          return timeTransform.transform(m);
        }
        return misval;
      };
    } else {
      return function (d) {
        var value = baseValFn(d);
        if (value !== misval) {
          var m = moment.duration(value);
          return timeTransform.transform(m);
        }
        return misval;
      };
    }
  } else if (facet.timeTransform.isDatetime) {
    /**
     * Time parsing:
     * 1. moment parses the string using the given format, but defaults to
     *    the [ISO 8601 standard](https://en.wikipedia.org/wiki/ISO_8601)
     * 2. Note that if the string contains timezone information, that is parsed too.
     * 3. The time is transformed to requested timezone, defaulting the locale default
     *    when no zone is set
     **/
    var timeFormat = facet.timeTransform.format;
    var timeZone = facet.timeTransform.zone;

    // use default ISO 8601 format
    if (!timeFormat) {
      timeFormat = moment.ISO_8601;
    }

    // use default locale timezone
    if (!timeZone) {
      timeZone = moment.tz.guess();
    }

    return function (d) {
      var value = baseValFn(d);
      if (value !== misval) {
        var m = moment.tz(value, timeFormat, timeZone);
        if (m.isValid()) {
          return timeTransform.transform(m);
        }
      }
      return misval;
    };
  }
}

/**
 * Returns the grouped value for a transformed value
 *
 * @callback groupCB
 * @param {Object} d Transformed value
 * @returns {Object} Group
 */

/**
 * Create a function that returns the group value for a partition
 * @param {Partition} partition
 * @returns {cb} Group function for this partition, taking a `Data`
 */
function groupFn (partition) {
  var facet = app.me.dataset.facets.get(partition.facetId);

  if (facet.displayConstant) {
    return function () { return '1'; };
  } else if (facet.displayContinuous) {
    return continuousGroupFn(partition);
  } else if (facet.displayCategorial) {
    return categorialGroupFn(partition);
  } else if (facet.displayDatetime) {
    return timeGroupFn(partition);
  }

  console.error('Group function not implemented for facet', facet);
}

function continuousGroupFn (partition) {
  return function (d) {
    if (d === misval) {
      return d;
    }

    var ngroups = partition.groups.length;
    if (d < partition.minval || d > partition.maxval) {
      return misval;
    }

    // bins include their lower bound, but not their upper bound
    var i = 0;
    while (i < ngroups && d >= partition.groups.models[i].max) {
      i++;
    }
    // special case last bin includes also upperbound d === facet.maxval
    if (i === ngroups) {
      return partition.groups.models[i - 1].value;
    }
    return partition.groups.models[i].value;
  };
}

function timeGroupFn (partition) {
  // Round the time to the specified resolution
  // see:
  //  http://momentjs.com/docs/#/manipulating/start-of/
  //  http://momentjs.com/docs/#/displaying/as-javascript-date/
  var timeBin = partition.groupingTimeResolution;
  return function (d) {
    if (d === misval) {
      return d;
    }
    var datetime = d.clone();
    return datetime.startOf(timeBin);
  };
}

function categorialGroupFn (partition) {
  // Don't do any grouping; that is done in the step from base value to value.
  // Matching of facet value and group could lead to a different ordering,
  // which is not allowed by crossfilter
  return function (d) {
    return d;
  };
}

module.exports = {
  baseValueFn: baseValueFn,
  valueFn: valueFn,
  groupFn: groupFn,

  reduceFn: reduceFn
};
