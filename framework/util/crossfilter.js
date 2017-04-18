/**
 * Utility functions for crossfilter datasets
 * We roughly follow the crossfilter design of dimensions and groups, but we
 * add extra steps to allow transformations on the data.
 * 1. a datum is turned into a raw value, ie. string or number etc. by rawValueFn
 * 2. it is then cast to the correct type value using baseValFn
 * 3. a further transfrom can be applied with valueFn
 * 4. a value is grouped using groupFn; this value must be either a number or a string.
 *
 * @module client/util-crossfilter
 * @see rawValueFn, baseValueFn, valueFn, groupFn
 */
var misval = require('./misval');
var moment = require('moment-timezone');
var util = require('../util/time');

/**
 * @typedef {Object} SubgroupValue
 * @property {number} count The count of the number of elements in this subgroup
 * @property {number} sum The sum of all elements in this subgroup
 */

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
      if (d === misval || d == null) {
        return misval;
      }
      if (d.count > 0) {
        return d.sum;
      } else {
        return misval;
      }
    };
  } else if (aggregate.doCount) {
    /**
     * @callback subgroupCount
     * @param {SubgroupValue} d
     * @returns {number} count
     */
    return function (d) {
      if (d === misval || d == null) {
        return misval;
      }
      if (d.count > 0) {
        return d.count;
      } else {
        return misval;
      }
    };
  } else if (aggregate.doAverage) {
    /**
     * @callback subgroupAverage
     * @param {SubgroupValue} d
     * @returns {number} d.sum/d.count
     */
    return function (d) {
      if (d === misval || d == null) {
        return misval;
      }

      if (d.count > 0) {
        return d.sum / d.count;
      } else {
        return misval;
      }
    };
  } else if (aggregate.doStddev) {
    /**
     * @callback subgroupStddev
     * @param {SubgroupValue} d
     * @returns {number} stddev(d)
     */
    return function (d) {
      if (d === misval || d == null) {
        return misval;
      }

      // \sum_i (x_i - \bar x)^2 =
      //   \sum_i (x_i^2 - 2x_i\bar x + (\bar x)^2) =
      //   \sum_i (x_i^2) - 2 N (\bar x)^2 + N(\bar x)^2 =
      //   \sum_i (x_i^2) - N (\bar x)^2
      if (d.count > 1) {
        return Math.sqrt((d.sumsquares - (d.sum * d.sum / d.count)) / (d.count - 1));
      } else {
        return misval;
      }
    };
  }

  console.error('Operation not implemented for this Aggregate', aggregate);
  return function (d) {
    if (d === misval || d == null) {
      return misval;
    }
    if (d.count > 0) {
      return d.count;
    } else {
      return misval;
    }
  };
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
 * Raw value for given facet
 * @param {Facet} facet
 * @returns {rawValueCB} Raw value function for this facet
 */
function rawValueFn (facet) {
  var accessor;

  // Array dimensions have a [] appended to the accessor,
  // remove it to get to the actual accessor
  var path = facet.accessor;
  if (path.match(/\[]$/)) {
    path = path.substring(0, path.length - 2);
  }

  var misvals = {};
  facet.misval.forEach(function (val) {
    misvals[val] = true;
  });

  // Access nested properties via a double hash sign, this to prevent collision with regular keys; fi. 'person.name'
  path = path.split('##');

  if (path.length === 1) {
    // Use a simple direct accessor, as it is probably faster than the more general case
    // and it was implemented already
    if (facet.misval.length > 0) {
      accessor = function (d) {
        var value = d[path[0]];
        if (value === undefined || value === null || value in misvals) {
          return misval;
        }
        return value;
      };
    } else {
      accessor = function (d) {
        var value = d[path[0]];
        if (value === undefined || value === null) {
          return misval;
        }
        return value;
      };
    }
  } else {
    // Recursively follow the crumbs to the desired property
    accessor = function (d) {
      var i = 0;
      var value = d;

      for (i = 0; i < path.length; i++) {
        if (value && value[path[i]] !== undefined) {
          value = value[path[i]];
        } else {
          return misval;
        }
      }

      if (value === null || value in misvals) {
        value = misval;
      }
      return value;
    };
  }

  return accessor;
}

/**
 * Base value for given facet, ie. cast to correct type or object.
 * @param {Facet} facet
 * @returns {vaseValueCB} Base value function for this facet
 */
function baseValueFn (facet) {
  var rawValFn = rawValueFn(facet);

  if (facet.isContinuous) {
    /*
     * Continuous facets:
     * Parse numeric value from base value
     */
    return function (d) {
      var val = parseFloat(rawValFn(d));
      if (isNaN(val) || val === Infinity || val === -Infinity) {
        return misval;
      }
      return val;
    };
  } else if (facet.isCategorial) {
    return function (d) {
      var vals = rawValFn(d);
      if (vals !== misval) {
        if (vals instanceof Array) {
          vals.forEach(function (val, i) {
            vals[i] = val.toString();
          });
        } else {
          vals = vals.toString();
        }
        return vals;
      }
      return misval;
    };
  } else if (facet.isDatetime) {
    /*
     * Time parsing:
     * 1. moment parses the string using the given format, but defaults to
     *    the [ISO 8601 standard](https://en.wikipedia.org/wiki/ISO_8601)
     * 2. Note that if the string contains timezone information, that is parsed too.
     * 3. The time is transformed to requested timezone, defaulting the locale default
     *    when no zone is set
    */
    var timeFormat = facet.datetimeTransform.format;
    if (timeFormat === 'ISO8601') {
      // use default ISO formatting
      timeFormat = moment.ISO_8601;
    }

    var timeZone = facet.datetimeTransform.zone;
    if (timeZone === 'ISO8601') {
      // use default locale timezone, get overridden if a string contains a timezone
      timeZone = moment.tz.guess();
    } else {
      timeZone = util.timeZones.get(timeZone, 'description').format;
    }

    return function (d) {
      var value = rawValFn(d);
      if (value !== misval) {
        var m = moment.tz(value, timeFormat, timeZone);
        if (m.isValid()) {
          return m;
        }
      }
      return misval;
    };
  } else if (facet.isDuration) {
    /*
     * Duration parsing:
     * 1. If no format is given, the string parsed using
     *    the [ISO 8601 standard](https://en.wikipedia.org/wiki/ISO_8601)
     * 2. If a format is given, the string is parsed as float and interpreted in the given units
     */
    var units = facet.durationTransform.units;
    if (units === 'ISO8601') {
      return function (d) {
        var value = rawValFn(d);

        // parse string if necessary
        if (value !== misval && typeof value === 'string' && value[0].toLowerCase() === 'p') {
          value = moment.duration(value);
        }

        // check for valid duration
        if (moment.isDuration(value)) {
          return value;
        }

        return misval;
      };
    } else {
      units = util.durationUnits.get(units, 'description').momentFormat;
      return function (d) {
        var value = rawValFn(d);

        // parse string if necessary
        if (value !== misval && !isNaN(value)) {
          // NOTE: isNaN('0') is false, if that gives problems, we could use:
          // value == +value) { // eslint-disable-line eqeqeq
          value = moment.duration(parseFloat(value), units);
        }

        // check for valid duration
        if (moment.isDuration(value)) {
          return value;
        }

        return misval;
      };
    }
  }

  // isCategorial, isText
  // no casting or constructing necessary, return the raw value
  return rawValFn;
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
  // get base value function
  var baseValFn = baseValueFn(facet);

  if (facet.isConstant) {
    return function () { return '1'; };
  } else if (facet.isContinuous) {
    // do we have a continuous transform?
    if (facet.continuousTransform && facet.continuousTransform.type !== 'none') {
      // yes, use it
      return function (d) {
        var val = facet.continuousTransform.transform(parseFloat(baseValFn(d)));
        if (isNaN(val) || val === Infinity || val === -Infinity) {
          return misval;
        }
        return val;
      };
    }
  } else if (facet.isCategorial) {
    // do we have a categorial transform?
    if (facet.categorialTransform && facet.categorialTransform.rules.length > 0) {
      // yes, use it
      return function (d) {
        var val = baseValFn(d);
        return val === misval ? misval : facet.categorialTransform.transform(baseValFn(d));
      };
    }
  } else if (facet.isDatetime) {
    // always use the transform, so we do not have to repeat the yes/no transfrom logic here
    return function (d) {
      var val = baseValFn(d);
      return val === misval ? misval : facet.datetimeTransform.transform(val);
    };
  } else if (facet.isDuration) {
    // always use the transform, so we do not have to repeat the yes/no transfrom logic here
    return function (d) {
      var val = baseValFn(d);
      return val === misval ? misval : facet.durationTransform.transform(val);
    };
  }

  // no transfrom, return base value
  return baseValFn;
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
    // special case last bin includes also upperbound d === partition.maxval
    if (i === ngroups) {
      return partition.groups.models[i - 1].value;
    }
    return partition.groups.models[i].value;
  };
}

/*
 * Round the datetime to the specified resolution
 * see:
 * http://momentjs.com/docs/#/manipulating/start-of/
 * http://momentjs.com/docs/#/displaying/as-javascript-date/
 */
function datetimeGroupFn (partition) {
  var timeStep = util.getDatetimeResolution(partition.minval, partition.maxval);
  return function (d) {
    if (d === misval) {
      return misval;
    }
    if (d.isBefore(partition.minval) || d.isAfter(partition.maxval)) {
      return misval;
    }
    return moment(d).startOf(timeStep).format();
  };
}

/*
 * Round the duration to the specified resolution
 */
function durationGroupFn (partition) {
  var timeStep = util.getDurationResolution(partition.minval, partition.maxval);
  return function (d) {
    if (d === misval) {
      return misval;
    }
    if (d < partition.minval || d > partition.maxval) {
      return misval;
    }
    var rounded = Math.floor(parseFloat(d.as(timeStep)));
    return moment.duration(rounded, timeStep).toISOString();
  };
}

/*
 * Don't do any grouping; that is done in the step from base value to value.
 * Matching of facet value and group could lead to a different ordering,
 * which is not allowed by crossfilter
 */
function categorialGroupFn (partition) {
  return function (d) { return d; };
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
  if (partition.isConstant) {
    return function () { return '1'; };
  } else if (partition.isContinuous) {
    return continuousGroupFn(partition);
  } else if (partition.isCategorial) {
    return categorialGroupFn(partition);
  } else if (partition.isDatetime) {
    return datetimeGroupFn(partition);
  } else if (partition.isDuration) {
    return durationGroupFn(partition);
  } else if (partition.isText) {
    return function (d) { return d.toString(); };
  } else {
    console.error('Group function not implemented for partition', partition);
  }
}

module.exports = {
  rawValueFn: rawValueFn,
  baseValueFn: baseValueFn,
  valueFn: valueFn,
  groupFn: groupFn,

  reduceFn: reduceFn
};
