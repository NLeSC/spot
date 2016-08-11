/**
 * Partition
 *
 * Describes a partitioning of the data, based on the values a Facet can take.
 * @class Partition
 */
var BaseModel = require('./base');
var Groups = require('./group-collection');
var moment = require('moment-timezone');

/**
 * Setup a grouping based on the `partition.minval`, `partition.maxval`,
 * `partition.groupingTimeResolution` and the `partition.groupingTimeFormat`.
 * @param {Partition} partition
 * @memberof! Partition
 */
function setTimeGroups (partition) {
  var timeStart = partition.minval;
  var timeEnd = partition.maxval;
  var timeStep = partition.groupingTimeResolution;
  var timeFormat = partition.groupingTimeFormat;

  partition.groups.reset();

  var binned, binStart, binEnd;
  var current = timeStart.clone();
  while (current.isBefore(timeEnd)) {
    binned = current.clone().startOf(timeStep);
    binStart = binned.clone();
    binEnd = binned.clone().add(1, timeStep);

    partition.groups.add({
      min: binStart.format(),
      max: binEnd.format(),
      value: binned,
      label: binned.format(timeFormat)
    });

    current.add(1, timeStep);
  }
}

/**
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

/**
 * Setup a grouping based on the `partition.categorialTransform`
 * @memberof! Partition
 * @param {Partition} partition
 */
function setCategorialGroups (partition) {
  // and update partition.groups
  partition.groups.reset();

  // use as-entered ordering
  delete partition.groups.comparator;

  partition.facet.categorialTransform.forEach(function (rule) {
    partition.groups.add({
      value: rule.group,
      label: rule.group
    });
  });
}

module.exports = BaseModel.extend({
  dataTypes: {
    'numberOrMoment': {
      set: function (value) {
        if (value === +value) {
          // allow setting a number
          return {
            val: value,
            type: 'numberOrMoment'
          };
        } else {
          // allow setting something moment understands
          value = moment(value, moment.ISO_8601);
          if (value.isValid()) {
            return {
              val: value,
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
     * Time is grouped by truncating; the groupingTimeResolution parameter sets the resolution.
     * See [this table](http://momentjs.com/docs/#/durations/creating/) for accpetable values
     * when using a crossfilter dataset.
     * @memberof! Partition
     * @type {string}
     */
    groupingTimeResolution: ['string', true, 'hours'],

    /**
     * Formatting string for displaying of datetimes
     * @memberof! Partition
     * @type {string}
     */
    groupingTimeFormat: ['string', true, 'hours']
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
  setCategorialGroups: function () {
    setCategorialGroups(this);
  },
  setContinuousGroups: function () {
    setContinuousGroups(this);
  },
  setTimeGroups: function () {
    setTimeGroups(this);
  }
});
