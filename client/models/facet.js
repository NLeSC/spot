/**
 * Facet
 *
 * @class Facet
 */

var AmpersandModel = require('ampersand-model');
var CategoryItemCollection = require('../models/categoryitem-collection');

// bins := {
//    label: <string>                          text for display
//    group: <string> || [<number>, <number>]  domain of this grouping
//    value: <string> || <number>              a value guaranteed to be in this group
// }
//
function facetBinsFn (facet) {
  var param = facet.groupingContinuousBins;
  var x0, x1, size, nbins;
  var i, label;

  var bins = [];
  if (facet.isContinuous) {
    // A fixed number of equally sized bins
    if (facet.groupFixedN) {
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

    var xm, xp;
    for (i = 0; i < nbins; i++) {
      xm = x0 + i * size;
      xp = x0 + (i + 1) * size;
      if (facet.groupLog) {
        xm = Math.exp(xm * Math.log(10.0));
        xp = Math.exp(xp * Math.log(10.0));

        label = xp;
      } else {
        label = 0.5 * (xm + xp);
      }

      // print with a precission of 4 decimals
      label = label.toPrecision(4);

      bins.push({label: label, group: [xm, xp], value: 0.5 * (xm + xp)});
    }
  } else if (facet.isCategorial) {
    facet.categories.forEach(function (category, i) {
      bins[i] = {label: category.group, group: category.group, value: category.group};
    });
  } else {
    console.error('Bins function not implemented for facet', facet);
  }
  return bins;
}

module.exports = AmpersandModel.extend({
  idAttribute: 'cid',
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
    /**
     * Type of dataset backing this facet
     * @memberof! Facet
     * @type {string}
     */
    modelType: ['string', 'true', 'generic'], // sql or crossfilter

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
     * Type of this facet. Can be either categorial, continuous, or time.
     * @memberof! Facet
     * @type {string}
     */
    type: {
      type: 'string',
      required: true,
      default: 'continuous',
      values: ['continuous', 'categorial', 'time']
    },

    /**
     * Type of this facet. Can be either categorial, continuous, or time.
     * @memberof! Facet
     * @type {string}
     */
    accessor: ['string', false, null], // property or mathjs string

    /**
     * Missing or invalid data indicator; for multiple values, use a comma separated, quoted list
     * @memberof! Facet
     * @type {string}
     */
    misvalAsText: ['string', true, 'Infinity'],

    /**
     * Kind of facet. Can be a property or a computed value ('math')
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

    // properties for transform
    transform: {
      type: 'string',
      required: true,
      default: 'none',
      values: [
        'none',
        'percentiles', 'exceedances', // continuous
        'timezone', 'todatetime', 'toduration' // time
      ]
    },

    // properties for transform-categorial

    // properties for transform-time
    transformTimeUnits: ['string', false, ''], // passed to momentsjs
    transformTimeZone: ['string', false, ''], // passed to momentsjs
    transformTimeReference: ['string', false, ''], // passed to momentsjs

    // properties for grouping-general
    minvalAsText: 'stringornumber',
    maxvalAsText: 'stringornumber',

    // properties for grouping-continuous
    groupingContinuousBins: ['number', true, 20],
    groupingContinuous: {type: 'string', required: true, default: 'fixedn', values: ['fixedn', 'fixedsc', 'fixeds', 'log']},

    // properties for grouping-time
    groupingTimeFormat: ['string', true, 'hours'], // passed to momentjs

    // properties for reduction: should be a valid SQL aggregation function
    reduction: {type: 'string', required: true, default: 'count', values: ['count', 'sum', 'avg']},
    reductionType: {type: 'string', required: true, default: 'absolute', values: ['absolute', 'percentage']}
  },

  collections: {
    // categoryItemCollection containing the mapping of facetValue to category
    categories: CategoryItemCollection
  },

  derived: {

    // properties for: type
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
      deps: ['type', 'transform', 'baseValueTimeType'],
      fn: function () {
        if (this.type === 'time') {
          if (this.baseValueTimeType === 'datetime' && this.transform === 'toduration') {
            return 'continuous';
          } else if (this.baseValueTimeType === 'duration' && this.transform === 'none') {
            return 'continuous';
          } else if (this.baseValueTimeType === 'duration' && this.transform === 'toduration') {
            return 'continuous';
          }
        }

        return this.type;
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
      }
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

    // properties for grouping-general
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
    },

    // Complex methods on the facet
    bins: {
      fn: function () {
        return facetBinsFn(this);
      },
      cache: false
    }
  }
});
