/**
 * Partition
 *
 * Describes a partitioning of the data, based on the values a Facet can take.
 * @class Partition
 */
var BaseModel = require('./base');
var Groups = require('./group-collection');
var moment = require('moment-timezone');
var app = require('ampersand-app');
var selection = require('../util-selection');
var util = require('../util-time');

/*
 * Setup a grouping based on the `partition.minval`, `partition.maxval`
 * @param {Partition} partition
 * @memberof! Partition
 */
function setTimeGroups (partition) {
  var timeStart = partition.minval;
  var timeEnd = partition.maxval;
  var timeRes = util.getResolution(timeStart, timeEnd);
  var timeFmt = util.getFormat(timeRes);

  partition.groups.reset();

  var binned, binStart, binEnd;
  var current = timeStart.clone();
  while ((!current.isAfter(timeEnd)) && partition.groups.length < 500) {
    binned = current.clone().startOf(timeRes);
    binStart = binned.clone();
    binEnd = binned.clone().add(1, timeRes);

    partition.groups.add({
      min: binStart.format(),
      max: binEnd.format(),
      value: binned,
      label: binned.format(timeFmt),
      isSelected: true
    });

    current.add(1, timeRes);
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
  delete partition.groups.comparator; // use as-entered ordering

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
        label: unlog(end).toPrecision(5),
        isSelected: true
      });
    } else {
      partition.groups.add({
        min: start,
        max: end,
        value: mid,
        label: mid.toPrecision(5),
        isSelected: true
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

  // use as-entered ordering
  delete partition.groups.comparator;

  if (app && app.me && app.me.dataset) {
    var facet = app.me.dataset.facets.get(partition.facetId);
    if (facet.isCategorial) {
      // default: a categorial facet, with a categorial parittion
      facet.categorialTransform.rules.forEach(function (rule) {
        partition.groups.add({
          value: rule.group,
          label: rule.group,
          count: rule.count,
          isSelected: true
        });
      });
    } else if (facet.isTimeOrDuration) {
      var format = facet.timeTransform.transformedFormat;
      var timeParts = util.getTimeParts();
      var timePart = timeParts.get(format, 'format');
      timePart.groups.forEach(function (g) {
        partition.groups.add({
          value: g,
          label: g,
          count: 0,
          isSelected: true
        });
      });
    }
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
    setTimeGroups(partition);
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
  var facet = app.me.dataset.facets.get(partition.facetId);
  options = options || {};

  if (facet.isContinuous) {
    partition.set({
      type: facet.type,
      groupingParam: 20,
      groupingContinuous: 'fixedn',
      minval: facet.continuousTransform.transformedMin,
      maxval: facet.continuousTransform.transformedMax
    }, options);
  } else if (facet.isCategorial) {
    partition.set({ type: facet.type }, options);
  } else if (facet.isTimeOrDuration) {
    partition.set({
      type: facet.timeTransform.transformedType,
      minval: facet.timeTransform.transformedMin,
      maxval: facet.timeTransform.transformedMax
    }, options);
  } else {
    console.error('Invalid partition');
  }
}

module.exports = BaseModel.extend({
  dataTypes: {
    'numberOrMoment': {
      set: function (value) {
        if (value === +value) {
          // allow setting a number
          return {
            val: +value,
            type: 'numberOrMoment'
          };
        } else {
          // allow setting something moment understands
          var newValue = moment(value, moment.ISO_8601);
          if (newValue.isValid()) {
            return {
              val: newValue,
              type: 'numberOrMoment'
            };
          }
        }
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
     * Partition label for displaying on plots
     * @memberof! Partition
     * @type {string}
     */
    label: {
      type: 'string',
      required: true,
      default: ''
    },
    /**
     * Partition units for displaying on plots
     * @memberof! Partition
     * @type {string}
     */
    units: {
      type: 'string',
      required: true,
      default: ''
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
      values: ['constant', 'continuous', 'categorial', 'datetime']
    },

    /**
     * The ID of the facet to partition over
     * @memberof! Partition
     * @type {string}
     */
    facetId: 'string',

    /**
     * When part of a partitioning, this deterimines the ordering
     * @memberof! Partition
     * @type {number}
     */
    rank: 'number',

    /**
     * For continuous or datetime Facets, the minimum value. Values lower than this are grouped to 'missing'
     * @memberof! Partition
     * @type {number|moment}
     */
    minval: 'numberOrMoment',

    /**
     * For continuous or datetime Facets, the maximum value. Values higher than this are grouped to 'missing'
     * @memberof! Partition
     * @type {number|moment}
     */
    maxval: 'numberOrMoment',

    /**
     * Extra parameter used in the grouping strategy: either the number of bins, or the bin size.
     * @memberof! Partition
     * @type {number}
     */
    groupingParam: ['number', true, 20],

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
    // NOTE: for categorial facets, contains group.value
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
