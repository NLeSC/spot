/**
 * Partition
 *
 * Describes a partitioning of the data, based on the values a Facet can take.
 * @class Partition
 */
var BaseModel = require('./util/base');
var Groups = require('./partition/group-collection');
var moment = require('moment-timezone');
var selection = require('./util/selection');
var util = require('./util/time');

/*
 * @param {Partition} partition
 * @memberof! Partition
 */
function setDatetimeGroups (partition) {
  var timeStart = partition.minval;
  var timeEnd = partition.maxval;
  var timeRes = util.getDatetimeResolution(timeStart, timeEnd);
  var timeZone = partition.zone;

  partition.groups.reset();

  var current = moment(timeStart);
  while ((!current.isAfter(timeEnd)) && partition.groups.length < 500) {
    partition.groups.add({
      min: moment(current).tz(timeZone).startOf(timeRes),
      max: moment(current).tz(timeZone).endOf(timeRes),
      value: moment(current).tz(timeZone).startOf(timeRes).format(),
      label: moment(current).tz(timeZone).startOf(timeRes).format()
    });
    current.add(1, timeRes);
  }
}

/*
 * @param {Partition} partition
 * @memberof! Partition
 */
function setDurationGroups (partition) {
  var dStart = partition.minval;
  var dEnd = partition.maxval;
  var dRes = util.getDurationResolution(dStart, dEnd);

  partition.groups.reset();

  var current = Math.floor(parseFloat(dStart.as(dRes)));
  var last = Math.floor(parseFloat(dEnd.as(dRes)));

  while (current < last) {
    partition.groups.add({
      min: moment.duration(current, dRes),
      max: moment.duration(current + 1, dRes),
      value: moment.duration(current, dRes).toISOString(),
      label: moment.duration(current, dRes).toISOString()
    });

    current = current + 1;
  }
}

/*
 * Setup a grouping based on the `partition.groupingContinuous`, `partition.minval`,
 * `partition.maxval`, and the `partition.groupingParam`.
 * @memberof! Partition
 * @param {Partition} partition
 */
function setContinuousGroups (partition) {
  var param = partition.groupingParam;
  var x0, x1, size, nbins;

  if (partition.groupFixedN) {
    // A fixed number of equally sized bins
    nbins = param;
    x0 = partition.minval;
    x1 = partition.maxval;
    size = (x1 - x0) / nbins;
  } else if (partition.groupFixedS) {
    // A fixed bin size
    size = param;
    x0 = Math.floor(partition.minval / size) * size;
    x1 = Math.ceil(partition.maxval / size) * size;
    nbins = (x1 - x0) / size;
  } else if (partition.groupFixedSC) {
    // A fixed bin size, centered on 0
    size = param;
    x0 = (Math.floor(partition.minval / size) - 0.5) * size;
    x1 = (Math.ceil(partition.maxval / size) + 0.5) * size;
    nbins = (x1 - x0) / size;
  } else if (partition.groupLog) {
    // Fixed number of logarithmically (base 10) sized bins
    nbins = param;
    x0 = Math.log(partition.minval) / Math.log(10.0);
    x1 = Math.log(partition.maxval) / Math.log(10.0);
    size = (x1 - x0) / nbins;
  }

  // and update partition.groups
  partition.groups.reset();
  partition.ordering = 'abc';

  function unlog (x) {
    return Math.exp(x * Math.log(10));
  }

  var i;
  for (i = 0; i < nbins; i++) {
    var start = x0 + i * size;
    var end = x0 + (i + 1) * size;
    var mid = 0.5 * (start + end);

    if (partition.groupLog) {
      partition.groups.add({
        min: unlog(start),
        max: unlog(end),
        value: unlog(start),
        label: unlog(end).toPrecision(5)
      });
    } else {
      partition.groups.add({
        min: start,
        max: end,
        value: mid,
        label: mid.toPrecision(5)
      });
    }
  }
}

/*
 * Setup a grouping based on the `partition.categorialTransform`
 * @memberof! Partition
 * @param {Partition} partition
 */
function setCategorialGroups (partition) {
  // and update partition.groups
  partition.groups.reset();
  partition.ordering = 'abc';

  // partition -> partitions -> filter -> filters -> dataset
  var filter = partition.collection.parent;
  var dataset = filter.collection.parent;
  var facet = dataset.facets.get(partition.facetName, 'name');

  if (facet.isCategorial) {
    // default: a categorial facet, with a categorial parittion
    facet.categorialTransform.rules.forEach(function (rule) {
      partition.groups.add({
        value: rule.group,
        label: rule.group,
        count: rule.count
      });
    });
  } else if (facet.isDatetime) {
    var format = facet.datetimeTransform.transformedFormat;
    var timePart = util.timeParts.get(format, 'description');

    timePart.groups.forEach(function (g) {
      partition.groups.add({
        value: g,
        label: g,
        count: 0
      });
    });
  } else {
    console.warn('Not implemented');
  }
}

/**
 * Setup the partition.groups()
 * @memberof! Partition
 * @param {Partition} partition
 */
function setGroups (partition) {
  if (partition.isCategorial) {
    setCategorialGroups(partition);
  } else if (partition.isContinuous) {
    setContinuousGroups(partition);
  } else if (partition.isDatetime) {
    setDatetimeGroups(partition);
  } else if (partition.isDuration) {
    setDurationGroups(partition);
  } else if (partition.isText) {
    partition.groups.reset();
  } else {
    console.error('Cannot set groups for partition', partition.getId());
  }
}

/**
 * Reset type, minimum and maximum values
 * @params {Partition} partition
 * @params {Object} Options - silent do not trigger change events
 * @memberof! Partition
 */
function reset (partition, options) {
  // partition -> partitions -> filter -> filters -> dataset
  var filter = partition.collection.parent;
  var dataset = filter.collection.parent;
  var facet = dataset.facets.get(partition.facetName, 'name');

  options = options || {};

  partition.set({
    type: facet.transform.transformedType,
    minval: facet.transform.transformedMin,
    maxval: facet.transform.transformedMax
  }, options);
}

module.exports = BaseModel.extend({
  dataTypes: {
    'numberDatetimeOrDuration': {
      set: function (value) {
        var newValue;

        // check for momentjs objects
        if (moment.isDuration(value)) {
          return {
            val: moment.duration(value),
            type: 'numberDatetimeOrDuration'
          };
        }
        if (moment.isMoment(value)) {
          return {
            val: value.clone(),
            type: 'numberDatetimeOrDuration'
          };
        }

        // try to create momentjs objects
        newValue = moment(value, moment.ISO_8601);
        if (newValue.isValid()) {
          return {
            val: newValue,
            type: 'numberDatetimeOrDuration'
          };
        }
        if (typeof value === 'string' && value[0].toLowerCase() === 'p') {
          newValue = moment.duration(value);
          return {
            val: newValue,
            type: 'numberDatetimeOrDuration'
          };
        }

        // try to set a number
        if (value === +value) {
          return {
            val: +value,
            type: 'numberDatetimeOrDuration'
          };
        }

        // failed..
        return {
          val: value,
          type: typeof value
        };
      },
      compare: function (currentVal, newVal) {
        if (currentVal instanceof moment) {
          return currentVal.isSame(newVal);
        } else {
          return +currentVal === +newVal;
        }
      }
    }
  },
  props: {
    /**
     * Label for displaying on plots
     * @memberof! Partition
     * @type {string}
     */
    label: {
      type: 'string',
      required: true,
      default: ''
    },
    /**
     * Show a legend for this partition
     * @memberof! Partition
     * @type {string}
     */
    showLegend: {
      type: 'boolean',
      required: false,
      default: true
    },
    /**
     * Show an axis label for this partition
     * @memberof! Partition
     * @type {string}
     */
    showLabel: {
      type: 'boolean',
      required: false,
      default: true
    },

    /**
     * Timezone for partitioning
     * @memberof! DatetimeTransform
     * @type {string}
     */
    zone: {
      type: 'string',
      required: 'true',
      default: function () {
        return moment.tz.guess();
      }
    },

    /**
     * Type of this partition
     * @memberof! Partition
     * @type {string}
     */
    type: {
      type: 'string',
      required: true,
      default: 'categorial',
      values: ['constant', 'continuous', 'categorial', 'datetime', 'duration', 'text']
    },

    /**
     * The ID of the facet to partition over
     * @memberof! Partition
     * @type {string}
     */
    facetName: 'string',

    /**
     * When part of a partitioning, this deterimines the ordering
     * @memberof! Partition
     * @type {number}
     */
    rank: 'number',

    /**
     * For categorial and text Facets, the ordering can be alfabetical or by count
     * @memberof! Partition
     * @type {number|moment}
     */
    ordering: {
      type: 'string',
      values: ['count', 'abc'],
      default: 'abc'
    },

    /**
     * For continuous or datetime Facets, the minimum value. Values lower than this are grouped to 'missing'
     * @memberof! Partition
     * @type {number|moment}
     */
    minval: 'numberDatetimeOrDuration',

    /**
     * For continuous or datetime Facets, the maximum value. Values higher than this are grouped to 'missing'
     * @memberof! Partition
     * @type {number|moment}
     */
    maxval: 'numberDatetimeOrDuration',

    /**
     * Extra parameter used in the grouping strategy: either the number of bins, or the bin size.
     * @memberof! Partition
     * @type {number}
     */
    groupingParam: ['number', true, 15],

    /**
     * Grouping strategy:
     *  * `fixedn`  fixed number of bins in the interval [minval, maxval]
     *  * `fixedsc` a fixed binsize, centered on zero
     *  * `fixeds`  a fixed binsize, starting at zero
     *  * `log`     fixed number of bins but on a logarithmic scale
     * Don't use directly but check grouping via the groupFixedN, groupFixedSC,
     * groupFixedS, and groupLog properties
     * @memberof! Partition
     * @type {number}
     */
    groupingContinuous: {
      type: 'string',
      required: true,
      default: 'fixedn',
      values: ['fixedn', 'fixedsc', 'fixeds', 'log']
    },

    /**
     * Depending on the type of partition, this can be an array of the selected groups,
     * or a numberic interval [start, end]
     * @memberof! Partition
     * @type {array}
     */
    // NOTE: for categorial facets, contains rule.group
    selected: {
      type: 'array',
      required: true,
      default: function () {
        return [];
      }
    }
  },
  collections: {
    /**
     * The (ordered) set of groups this Partition can take, making up this partition.
     * Used for plotting
     * @memberof! Partition
     * @type {Group[]}
     */
    groups: Groups
  },
  derived: {
    // properties for: type
    isConstant: {
      deps: ['type'],
      fn: function () {
        return this.type === 'constant';
      }
    },
    isContinuous: {
      deps: ['type'],
      fn: function () {
        return this.type === 'continuous';
      }
    },
    isCategorial: {
      deps: ['type'],
      fn: function () {
        return this.type === 'categorial';
      }
    },
    isDatetime: {
      deps: ['type'],
      fn: function () {
        return this.type === 'datetime';
      }
    },
    isDuration: {
      deps: ['type'],
      fn: function () {
        return this.type === 'duration';
      }
    },
    isText: {
      deps: ['type'],
      fn: function () {
        return this.type === 'text';
      }
    },
    // properties for grouping-continuous
    groupFixedN: {
      deps: ['groupingContinuous'],
      fn: function () {
        return this.groupingContinuous === 'fixedn';
      }
    },
    groupFixedSC: {
      deps: ['groupingContinuous'],
      fn: function () {
        return this.groupingContinuous === 'fixedsc';
      }
    },
    groupFixedS: {
      deps: ['groupingContinuous'],
      fn: function () {
        return this.groupingContinuous === 'fixeds';
      }
    },
    groupLog: {
      deps: ['groupingContinuous'],
      fn: function () {
        return this.groupingContinuous === 'log';
      }
    }
  },
  updateSelection: function (group) {
    selection.updateSelection(this, group);
  },
  filterFunction: function () {
    return selection.filterFunction(this);
  },
  setGroups: function () {
    setGroups(this);
  },
  reset: function (options) {
    reset(this, options);
  }
});
