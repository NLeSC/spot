/**
 * Facets are the main abstraction over the data.
 *
 * A dataset is a collection of (similar) items, with each item having a certain set of properties, ie. facets.
 * The Facet class defines the property: It can be a continuous value, a set of labels or tags,
 * or it can be result of some transformation or equation.
 *
 * It also defines how to group (or cluster) items based on this facet; and how to reduce a group of facets to a
 * single value for plotting, @see facet.bins()
 *
 * @class Facet
 */
var BaseModel = require('./base');
var CategoryItemCollection = require('../models/categoryitem-collection');

function facetBinsFn (facet) {
  var param = facet.groupingParam;
  var x0, x1, size, nbins;
  var i, label;

  var bins = [];
  if (facet.displayConstant) {
    bins.push({label: '1', group: '1', value: '1'});
  } else if (facet.displayContinuous) {
    if (facet.transformPercentiles) {
      if (facet.groupFixedN) {
        // A fixed number of equally sized bins
        nbins = param;
        x0 = 0;
        x1 = 100;
        size = 100 / nbins;
      } else {
        // A fixed bin size, but adjust the size to be divide 100
        nbins = Math.round(100 / param);
        size = 100 / nbins;
        x0 = 0;
        x1 = 100;
      }
    } else {
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
    }

    var xm, xp;
    for (i = 0; i < nbins; i++) {
      xm = x0 + i * size;
      xp = x0 + (i + 1) * size;

      if (facet.groupLog) {
        xm = Math.exp(xm * Math.log(10.0));
        xp = Math.exp(xp * Math.log(10.0));

        label = xp;
      } else {
        if (xm < facet.minval) {
          xm = facet.minval;
        }
        if (xp > facet.maxval) {
          xp = facet.maxval;
        }
        label = 0.5 * (xm + xp);
      }

      // print with a precission of 4 decimals
      label = label.toPrecision(4);

      bins.push({label: label, group: [xm, xp], value: 0.5 * (xm + xp)});
    }
  } else if (facet.displayCategorial) {
    var exists = {};
    facet.categories.forEach(function (category) {
      var label = category.group;

      if (!exists[label]) {
        bins.push({label: label, group: label, value: label});
        exists[label] = true;
      }
    });
  } else {
    console.error('Bins function not implemented for facet', facet);
  }
  return bins;
}

module.exports = BaseModel.extend({
  dataTypes: {
    // string or number allowed, but stored as string
    stringornumber: {
      set: function (newVal) {
        try {
          return {
            type: 'stringornumber',
            val: newVal.toString()
          };
        } catch (anyError) {
          return {type: 'stringornumber', val: '0'};
        }
      },
      compare: function (currentVal, newVal, attributeName) {
        try {
          return currentVal === newVal;
        } catch (anyError) {
          return false;
        }
      }
    }
  },
  props: {
    show: ['boolean', false, true], // show in facet lists (used for interactive searching on Facets page)
    active: ['boolean', false, false], // show in facet lists (on analyze page)

    // general facet properties
    /**
     * Description of this facet, for displaying purposes
     * @memberof! Facet
     * @type {string}
     */
    description: ['string', true, ''], // data-hook: general-description-input
    /**
     * For continuous facets, that is quantative properties, the units for displaying purposes
     * @memberof! Facet
     * @type {string}
     */
    units: ['string', true, ''], // data-hook: general-units-input
    /**
     * Short name for this facet
     * @memberof! Facet
     * @type {string}
     */
    name: ['string', true, ''], // data-hook: general-title-input

    /**
     * Type of this facet:
     *  * `constant`    A constant value of "1" for all data items
     *  * `continuous`  The facet takes on real numbers
     *  * `categorial`  The facet is a string, or an array of strings (for labels and tags)
     *  * `time`        The facet is a datetime (using momentjs)
     * Check for facet type using isConstant, isContinuous, isCategorial, or isTime properties.
     * @memberof! Facet
     * @type {string}
     */
    type: {
      type: 'string',
      required: true,
      default: 'constant',
      values: ['constant', 'continuous', 'categorial', 'time']
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
    accessor: ['string', false, null], // property or mathjs string

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
     * Don't use directly but check for kind using
     * isProperty, or isMath properties.
     * @memberof! Facet
     * @type {string}
     */
    kind: {
      type: 'string',
      required: true,
      default: 'property',
      values: ['property', 'math']
    },

    // properties for base-value-time
    baseValueTimeFormat: ['string', false, ''], // passed to momentjs
    baseValueTimeZone: ['string', false, ''], // passed to momentjs
    baseValueTimeType: {
      type: 'string',
      required: true,
      default: 'datetime',
      values: ['datetime', 'duration']
    },

    /**
     * Applied transformation for continuous facets, defaults to 'none'. Valid transforms are:
     *  * `none`         No transform
     *  * `percentiles`  Values are mapped to their approximate percentile
     *  * `exceedances`  Values are mapped to their exceedance probability
     * Don't use directly but check transform using
     * transformNone, transformPercentiles, or transformExceedances properties.
     * @memberof! Facet
     * @type {string}
     */
    transform: {
      type: 'string',
      required: true,
      default: 'none',
      values: [
        'none',
        'percentiles', 'exceedances' // continuous
      ]
    },

    /**
     * properties for transform-time
     * transformTimeUnits:     new units for durations
     * transformTimeZone:      new timezone for datetimes
     * transformTimeReference: when set transforms between duration and datetime by adding/subtracting this value
     **/
    transformTimeUnits: ['string', false, ''], // passed to momentsjs
    transformTimeZone: ['string', false, ''], // passed to momentsjs
    transformTimeReference: ['string', false, ''], // passed to momentsjs

    /**
     * For continuous Facets, the minimum value. Values lower than this are grouped to 'missing'
     * Parsed value available in the minval property
     * @memberof! Facet
     * @type {number}
     */
    minvalAsText: 'stringornumber',
    /**
     * For continuous Facets, the maximum value. Values higher than this are grouped to 'missing'
     * Parsed value available in the maxval property
     * @memberof! Facet
     * @type {number}
     */
    maxvalAsText: 'stringornumber',

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
     * Don't use directly but check grouping via the  FIXME
     * @memberof! Facet
     * @type {number}
     */
    groupingContinuous: {type: 'string', required: true, default: 'fixedn', values: ['fixedn', 'fixedsc', 'fixeds', 'log']},

    // properties for grouping-time
    groupingTimeFormat: ['string', true, 'hours'], // passed to momentjs

    // NOTE: properties for reduction, should be a valid SQL aggregation function
    /**
     * Reduction strategy:
     *  * `count`    count the number of elements in the group
     *  * `sum`      sum the elements in the group
     *  * `average`  take the average of the elements in the group
     * @memberof! Facet
     * @type {number}
     */
    reduction: {type: 'string', required: true, default: 'count', values: ['count', 'sum', 'avg']},
    /**
     * Reduction normalization
     *  * `absolute`  none, ie data in same units as the original data
     *  * `relative`  data is in percentages of the total; for subgroups in percentage of the parent group
     * @memberof! Facet
     * @type {number}
     */
    reductionType: {type: 'string', required: true, default: 'absolute', values: ['absolute', 'percentage']}
  },

  collections: {
    // categoryItemCollection containing the mapping of facetValue to category
    categories: CategoryItemCollection
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
    isTime: {
      deps: ['type'],
      fn: function () {
        return this.type === 'time';
      },
      cache: false
    },

    // determine actual type from type + transform
    displayType: {
      deps: ['type', 'transformTimeReference', 'transformTimeUnits', 'baseValueTimeType'],
      fn: function () {
        if (this.type === 'time') {
          if (this.baseValueTimeType === 'duration') {
            if (this.transformTimeReference.length > 0) {
              return 'time';
            } else {
              return 'continuous';
            }
          } else if (this.baseValueTimeType === 'datetime') {
            if (this.transformTimeReference.length > 0) {
              return 'continuous';
            } else if (this.transformTimeUnits.length > 0) {
              return 'categorial';
            } else {
              return 'time';
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
    displayTime: {
      deps: ['displayType'],
      fn: function () {
        return this.displayType === 'time';
      },
      cache: false
    },

    // properties for: base-value
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

    // properties for: transform-continuous
    transformNone: {
      deps: ['transform'],
      fn: function () {
        return this.transform === 'none';
      },
      cache: false
    },
    transformPercentiles: {
      deps: ['transform'],
      fn: function () {
        return this.transform === 'percentiles';
      },
      cache: false
    },
    transformExceedances: {
      deps: ['transform'],
      fn: function () {
        return this.transform === 'exceedances';
      },
      cache: false
    },

    // properties for: transform-time
    transformTimezone: {
      deps: ['transform'],
      fn: function () {
        return this.transform === 'timezone';
      },
      cache: false
    },
    transformToDatetime: {
      deps: ['transform'],
      fn: function () {
        return this.transform === 'todatetime';
      },
      cache: false
    },
    transformToDuration: {
      deps: ['transform'],
      fn: function () {
        return this.transform === 'toduration';
      },
      cache: false
    },

    minval: {
      deps: ['minvalAsText'],
      fn: function () {
        return parseFloat(this.minvalAsText);
      }
    },
    maxval: {
      deps: ['maxvalAsText'],
      fn: function () {
        return parseFloat(this.maxvalAsText);
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
    reduceCount: {
      deps: ['reduction'],
      fn: function () {
        return this.reduction === 'count';
      }
    },
    reduceSum: {
      deps: ['reduction'],
      fn: function () {
        return this.reduction === 'sum';
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

  /**
   * @typedef Bin
   * @memberof Facet
   * @property {string} label Text for display
   * @property {(string|number[])} group domain of this grouping
   * @property {(string|number)} value a value guaranteed to be in thie group
   */
  /**
   * bins
   * @memberof! Facet
   * @returns {Bin[]}
   */
  bins: function () {
    return facetBinsFn(this);
  }
});
