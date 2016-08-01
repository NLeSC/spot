/**
 * Facets are the main abstraction over the data.
 *
 * A `Dataset` is a collection of (similar) items, with each item having a certain set of properties, ie. `Facet`s.
 * The `Facet` class defines the property: It can be a continuous value, a set of labels or tags,
 * or it can be result of some transformation or equation.
 *
 * It also defines how to group (or cluster) items based on this `Facet`; and how to reduce (aggregate)
 * a group of facets to a single value for plotting.
 * `Facet.groups` contains the possible values the facet can take.
 *
 *
 * @class Facet
 * @extends Base
 */
var BaseModel = require('./base');
var CategorialTransform = require('./categorial-transform');
var ContinuousTransform = require('./continuous-transform');
var Groups = require('../models/group-collection');
var moment = require('moment-timezone');

/**
 * Setup a grouping based on the `facet.minval`, `facet.maxval`, `facet.groupingTimeResolution` and the `facet.groupingTimeFormat`.
 * @param {Facet} facet
 * @memberof! Facet
 */
function setTimeGroups (facet) {
  var timeStart = facet.minval;
  var timeEnd = facet.maxval;
  var timeStep = facet.groupingTimeResolution;
  var timeFormat = facet.groupingTimeFormat;

  facet.groups.reset();

  var binned, binStart, binEnd;
  var current = timeStart.clone();
  while (current.isBefore(timeEnd)) {
    binned = current.clone().startOf(timeStep);
    binStart = binned.clone();
    binEnd = binned.clone().add(1, timeStep);

    facet.groups.add({
      min: binStart.format(),
      max: binEnd.format(),
      value: binned,
      label: binned.format(timeFormat)
    });

    current.add(1, timeStep);
  }
}

/**
*  Setup a grouping based on the `facet.groupingContinuous`, `facet.minval`, `facet.maxval`, and the `facet.groupingParam`.
 * @memberof! Facet
 * @param {Facet} facet
 */
function setContinuousGroups (facet) {
  var param = facet.groupingParam;
  var x0, x1, size, nbins;

  if (facet.groupFixedN) {
    // A fixed number of equally sized bins
    nbins = param;
    x0 = facet.minval;
    x1 = facet.maxval;
    size = (x1 - x0) / nbins;
  } else if (facet.groupFixedS) {
    // A fixed bin size
    size = param;
    x0 = Math.floor(facet.minval / size) * size;
    x1 = Math.ceil(facet.maxval / size) * size;
    nbins = (x1 - x0) / size;
  } else if (facet.groupFixedSC) {
    // A fixed bin size, centered on 0
    size = param;
    x0 = (Math.floor(facet.minval / size) - 0.5) * size;
    x1 = (Math.ceil(facet.maxval / size) + 0.5) * size;
    nbins = (x1 - x0) / size;
  } else if (facet.groupLog) {
    // Fixed number of logarithmically (base 10) sized bins
    nbins = param;
    x0 = Math.log(facet.minval) / Math.log(10.0);
    x1 = Math.log(facet.maxval) / Math.log(10.0);
    size = (x1 - x0) / nbins;
  }

  // and update facet.groups
  facet.groups.reset();
  delete facet.groups.comparator; // use as-entered ordering

  function unlog (x) {
    return Math.exp(x * Math.log(10));
  }

  var i;
  for (i = 0; i < nbins; i++) {
    var start = x0 + i * size;
    var end = x0 + (i + 1) * size;
    var mid = 0.5 * (start + end);

    if (facet.groupLog) {
      facet.groups.add({
        min: unlog(start),
        max: unlog(end),
        value: unlog(start),
        label: unlog(mid).toPrecision(5)
      });
    } else {
      facet.groups.add({
        min: start,
        max: end,
        value: mid,
        label: mid.toPrecision(5)
      });
    }
  }
}

module.exports = BaseModel.extend({
  props: {
    /**
     * Show in facet lists (used for interactive searching on Facets page)
     * @memberof! Facet
     * @type {boolean}
     */
    show: ['boolean', false, true],

    /**
     * Show facet bar (on Analyze page)
     * @memberof! Facet
     * @type {boolean}
     */
    active: ['boolean', false, false],

    // general facet properties
    /**
     * Description of this facet, for displaying purposes
     * @memberof! Facet
     * @type {string}
     */
    description: ['string', true, ''],

    /**
     * For continuous facets, its units for displaying purposes
     * @memberof! Facet
     * @type {string}
     */
    units: ['string', true, ''],

    /**
     * Short name for this facet, for displaying purposes
     * @memberof! Facet
     * @type {string}
     */
    name: ['string', true, ''],

    /**
     * Type of this facet:
     *  * `constant`        A constant value of "1" for all data items
     *  * `continuous`      The facet takes on real numbers
     *  * `categorial`      The facet is a string, or an array of strings (for labels and tags)
     *  * `timeorduration`  The facet is a datetime (using momentjs)
     * Check for facet type using isConstant, isContinuous, isCategorial, or isTimeOrDuration properties.
     * @memberof! Facet
     * @type {string}
     */
    type: {
      type: 'string',
      required: true,
      default: 'categorial',
      values: ['constant', 'continuous', 'categorial', 'timeorduration']
    },

    /**
     * The accessor for this facet. Can be the property's name or a formula.
     * For nested properties use dot notation: For a dataset `[ {name: {first: "Santa", last: "Claus"}}, ...]`
     * you can use `name.first` and `name.last` to get Santa and Claus, respectively.
     *
     * Formula evaluation depends on the dataset; mathjs is used for crossfilter datasets and
     * valid sql equations can be entered for SQL datasets.
     * @memberof! Facet
     * @type {string}
     */
    accessor: ['string', false, null],

    /**
     * Missing or invalid data indicator; for multiple values, use a comma separated, quoted list
     * Use double quotes like these "1". The parsed values are available in the misval property.
     * @memberof! Facet
     * @type {string}
     */
    misvalAsText: ['string', true, 'Infinity'],

    /**
     * Kind of facet:
     *  * `property` a property of the data item
     *  * `math`     an equation (evaluated by mathjs or the SQL database)
     * Don't use directly but check for kind using `isProperty`, or `isMath` properties.
     * @memberof! Facet
     * @type {string}
     */
    kind: {
      type: 'string',
      required: true,
      default: 'property',
      values: ['property', 'math']
    },

    // TODO move to time transform
    /**
     * When datetime or durations are not in ISO8601 format, this format will be used to parse the datetime
     * Implementation depends on the dataset. Crossfilter dataset uses momentjs
     * @memberof! Facet
     * @type {string}
     */
    baseValueTimeFormat: ['string', false, ''], // passed to momentjs

    /**
     * Timezone to use when parsing, for when timezone information is absent or incorrect.
     * @memberof! Facet
     * @type {string}
     */
    baseValueTimeZone: ['string', false, ''], // passed to momentjs

    /**
     * Type of datetime object: a datetime or a duration
     * Do not use directly, but use `isDatetime` and `isDuration` methods.
     * @memberof! Facet
     * @type {string}
     */
    baseValueTimeType: {
      type: 'string',
      required: true,
      default: 'datetime',
      values: ['datetime', 'duration']
    },

    /**
     * For durations, sets the new units to use (years, months, weeks, days, hours, minutes, seconds, miliseconds). Data will be transformed.
     * For datetimes, reformats to a string using the momentjs or postgresql format specifiers. This allows a transformation to day of the year, or day of week etc.
     * @memberof! Facet
     * @type {string}
     */
    transformTimeUnits: ['string', false, ''], // passed to momentsjs

    /**
     * For datetimes, transform the date to this timezone.
     * @memberof! Facet
     * @type {string}
     */
    transformTimeZone: ['string', false, ''], // passed to momentsjs

    /**
     * Controls conversion between datetimes and durations by adding or subtracting this date
     * @memberof! Facet
     * @type {string}
     */
    transformTimeReference: ['string', false, ''], // passed to momentsjs

    /**
     * For continuous or datetime Facets, the minimum value as text. Values lower than this are grouped to 'missing'
     * Parsed value available in the `minval` property
     * @memberof! Facet
     * @type {number}
     */
    minvalAsText: 'string',
    /**
     * For continuous or datetime Facets, the maximum value as text. Values higher than this are grouped to 'missing'
     * Parsed value available in the `maxval` property
     * @memberof! Facet
     * @type {number}
     */
    maxvalAsText: 'string',

    /**
     * Extra parameter used in the grouping strategy: either the number of bins, or the bin size.
     * @memberof! Facet
     * @type {number}
     */
    groupingParam: ['number', true, 20],

    /**
     * Grouping strategy:
     *  * `fixedn`  fixed number of bins in the interval [minval, maxval]
     *  * `fixedsc` a fixed binsize, centered on zero
     *  * `fixeds`  a fixed binsize, starting at zero
     *  * `log`     fixed number of bins but on a logarithmic scale
     * Don't use directly but check grouping via the groupFixedN, groupFixedSC, groupFixedS, and groupLog properties
     * @memberof! Facet
     * @type {number}
     */
    groupingContinuous: {type: 'string', required: true, default: 'fixedn', values: ['fixedn', 'fixedsc', 'fixeds', 'log']},

    /**
     * Time is grouped by truncating; the groupingTimeResolution parameter sets the resolution.
     * See [this table](http://momentjs.com/docs/#/durations/creating/) for accpetable values when using a crossfilter dataset.
     * @memberof! Facet
     * @type {string}
     */
    groupingTimeResolution: ['string', true, 'hours'],

    /**
     * Formatting string for displaying of datetimes
     * @memberof! Facet
     * @type {string}
     */
    groupingTimeFormat: ['string', true, 'hours'],

    /**
     * Aggregation strategy:
     *  * `count`    count the number of elements in the group
     *  * `sum`      sum the elements in the group
     *  * `average`  take the average of the elements in the group
     * @memberof! Facet
     * @type {number}
     */
    reduction: {type: 'string', required: true, default: 'count', values: ['count', 'sum', 'avg']},
    // NOTE: properties for reduction, should be a valid SQL aggregation function

    /**
     * Aggregation normalization:
     *  * `absolute`  none, ie data in same units as the original data
     *  * `relative`  data is in percentages of the total; for subgroups in percentage of the parent group
     * @memberof! Facet
     * @type {number}
     */
    reductionType: {type: 'string', required: true, default: 'absolute', values: ['absolute', 'percentage']}
  },

  collections: {
    /**
     * A categorial transformation to apply to the data
     * @memberof! Facet
     * @type {CategorialTransform}
     */
    categorialTransform: CategorialTransform,

    /**
     * A continuous transformation to apply to the data
     * @memberof! Facet
     * @type {ContinuousTransform}
     */
    continuousTransform: ContinuousTransform,

    /**
     * The (ordered) set of groups this Facet can take, used for plotting
     * @memberof! Facet
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
      },
      cache: false
    },
    isContinuous: {
      deps: ['type'],
      fn: function () {
        return this.type === 'continuous';
      },
      cache: false
    },
    isCategorial: {
      deps: ['type'],
      fn: function () {
        return this.type === 'categorial';
      },
      cache: false
    },
    isTimeOrDuration: {
      deps: ['type'],
      fn: function () {
        return this.type === 'timeorduration';
      },
      cache: false
    },

    /**
     * The actual type of the facet after transformation.
     * Do not check directly, but use `displayConstant`, `displayContinuous`, `displayCategorial`, `displayDatetime`
     * @memberof! Facet
     * @type {string}
     * @readonly
     */
    displayType: {
      deps: ['type', 'transformTimeReference', 'transformTimeUnits', 'baseValueTimeType'],
      fn: function () {
        if (this.type === 'timeorduration') {
          if (this.baseValueTimeType === 'duration') {
            if (this.transformTimeReference.length > 0) {
              return 'datetime';
            } else {
              return 'continuous';
            }
          } else if (this.baseValueTimeType === 'datetime') {
            if (this.transformTimeReference.length > 0) {
              return 'continuous'; // ie. a duration
            } else if (this.transformTimeUnits.length > 0) {
              return 'categorial'; // weekday, etc.
            } else {
              return 'datetime';
            }
          }
        }
        return this.type;
      },
      cache: false
    },
    displayConstant: {
      deps: ['displayType'],
      fn: function () {
        return this.displayType === 'constant';
      },
      cache: false
    },
    displayContinuous: {
      deps: ['displayType'],
      fn: function () {
        return this.displayType === 'continuous';
      },
      cache: false
    },
    displayCategorial: {
      deps: ['displayType'],
      fn: function () {
        return this.displayType === 'categorial';
      },
      cache: false
    },
    displayDatetime: {
      deps: ['displayType'],
      fn: function () {
        return this.displayType === 'datetime';
      },
      cache: false
    },

    /**
     * Array of missing data indicators
     * @memberof! Facet
     * @type {Object[]}
     * @readonly
     */
    misval: {
      deps: ['misvalAsText'],
      fn: function () {
        // Parse the text content as a JSON array:
        //  - strings should be quoted
        //  - numbers unquoated
        //  - special numbers not allowed: NaN, Infinity
        try {
          return JSON.parse('[' + this.misvalAsText + ']');
        } catch (e) {
          return ['Missing'];
        }
      },
      cache: false
    },
    isProperty: {
      deps: ['kind'],
      fn: function () {
        return this.kind === 'property';
      },
      cache: false
    },
    isMath: {
      deps: ['kind'],
      fn: function () {
        return this.kind === 'math';
      },
      cache: false
    },

    // properties for: base-value-time
    isDatetime: {
      deps: ['baseValueTimeType'],
      fn: function () {
        return this.baseValueTimeType === 'datetime';
      },
      cache: false
    },
    isDuration: {
      deps: ['baseValueTimeType'],
      fn: function () {
        return this.baseValueTimeType === 'duration';
      },
      cache: false
    },

    /**
     * For continuous or datetime Facets, the minimum value.
     * @memberof! Facet
     * @type {number|datetime}
     * @readonly
     */
    minval: {
      deps: ['minvalAsText', 'displayType'],
      fn: function () {
        if (this.displayType === 'continuous') {
          return parseFloat(this.minvalAsText);
        } else if (this.displayType === 'datetime') {
          return moment(this.minvalAsText);
        }
      }
    },
    /**
     * For continuous or datetime Facets, the maximum value.
     * @memberof! Facet
     * @type {number|datetime}
     * @readonly
     */
    maxval: {
      deps: ['maxvalAsText', 'displayType'],
      fn: function () {
        if (this.displayType === 'continuous') {
          return parseFloat(this.maxvalAsText);
        } else if (this.displayType === 'datetime') {
          return moment(this.maxvalAsText);
        }
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
    },

    // properties for reduction
    reduceSum: {
      deps: ['reduction'],
      fn: function () {
        return this.reduction === 'sum';
      }
    },
    reduceCount: {
      deps: ['reduction'],
      fn: function () {
        return this.reduction === 'count';
      }
    },
    reduceAverage: {
      deps: ['reduction'],
      fn: function () {
        return this.reduction === 'avg';
      }
    },
    reduceAbsolute: {
      deps: ['reductionType'],
      fn: function () {
        return this.reductionType === 'absolute';
      }
    },
    reducePercentage: {
      deps: ['reductionType'],
      fn: function () {
        return this.reductionType === 'percentage';
      }
    }
  },
  setContinuousGroups: function () {
    setContinuousGroups(this);
  },
  setTimeGroups: function () {
    setTimeGroups(this);
  }
});
