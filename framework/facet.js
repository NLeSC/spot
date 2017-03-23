/**
 * Facets are the main abstraction over the data.
 *
 * A `Dataset` is a collection of (similar) items, with each item having a certain set of properties, ie. `Facet`s.
 * The `Facet` class defines the property: It can be a continuous value, a set of labels or tags,
 * or it can be result of some transformation or equation.
 *
 * @class Facet
 * @extends Base
 */
var BaseModel = require('./util/base');
var CategorialTransform = require('./facet/categorial-transform');
var ContinuousTransform = require('./facet/continuous-transform');
var datetimeTransform = require('./facet/datetime-transform');
var durationTransform = require('./facet/duration-transform');
var textTransform = require('./facet/text-transform');
var moment = require('moment-timezone');

module.exports = BaseModel.extend({
  initialize: function () {
    this.on('change:type', function (facet, newval) {
      // reset transformations on type change
      this.continuousTransform.reset();
      this.categorialTransform.reset();
      this.datetimeTransform.reset();
      this.durationTransform.reset();
    });
  },
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
    isActive: ['boolean', false, false],

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
     *  * `categorial`      The facet is a string, or an array of strings (for a well defined set of labels and tags)
     *  * `datetime`        The facet is a datetime (using momentjs.tz)
     *  * `duration`        The facet is a duration (using momentjs.duration)
     *  * `text`            Freeform text.
     * Check for facet type using isConstant, isContinuous, isCategorial, isDatetime, isDuration, or isText  properties.
     * @memberof! Facet
     * @type {string}
     */
    type: {
      type: 'string',
      required: true,
      default: 'categorial',
      values: ['constant', 'continuous', 'categorial', 'datetime', 'duration', 'text']
    },

    /**
     * The accessor for this facet.
     * For nested properties use dot notation: For a dataset `[ {name: {first: "Santa", last: "Claus"}}, ...]`
     * you can use `name.first` and `name.last` to get Santa and Claus, respectively.
     *
     * @memberof! Facet
     * @type {string}
     */
    accessor: ['string', false, null],

    /**
     * Missing or invalid data indicator; for multiple values, use a comma separated, quoted list
     * Numbers, strings, booleans, and the special value null are allowed.
     * Use single or double quotes for strings "missing".
     * The parsed values are available in the misval property.
     *
     * @memberof! Facet
     * @type {string}
     */
    misvalAsText: 'string',

    /**
     * For continuous or datetime Facets, the minimum value as text.
     * Parsed value available in the `minval` property
     * @memberof! Facet
     * @type {string}
     */
    minvalAsText: 'string',
    /**
     * For continuous or datetime Facets, the maximum value as text.
     * Parsed value available in the `maxval` property
     * @memberof! Facet
     * @type {string}
     */
    maxvalAsText: 'string'
  },
  children: {
    /**
     * A categorial transformation to apply to the data
     * @memberof! Facet
     * @type {CategorialTransform}
     */
    categorialTransform: CategorialTransform,
    /**
     * A datetime transformation to apply to the data
     * @memberof! Facet
     * @type {dateimeTransform}
     */
    datetimeTransform: datetimeTransform,
    /**
     * A duration transformation to apply to the data
     * @memberof! Facet
     * @type {dateimeTransform}
     */
    durationTransform: durationTransform,
    /**
     * A continuous transformation to apply to the data
     * @memberof! Facet
     * @type {ContinuousTransform}
     */
    continuousTransform: ContinuousTransform,
    /**
     * A text transform
     * @memberof! Facet
     * @type {TextTransform}
     */
    textTransform: textTransform
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
          if (this.misvalAsText !== null) {
            return JSON.parse('[' + this.misvalAsText + ']');
          } else {
            return [];
          }
        } catch (e) {
          return [];
        }
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
      deps: ['minvalAsText', 'type'],
      fn: function () {
        var min;
        if (this.isContinuous) {
          min = parseFloat(this.minvalAsText);
          if (isNaN(min)) {
            min = 0;
          }
        } else if (this.isDatetime) {
          min = moment(this.minvalAsText, moment.ISO_8601);
          if (!min.isValid()) {
            min = moment('2010-01-01 00:00', moment.ISO_8601);
          }
        } else if (this.isDuration) {
          min = moment.duration(this.minvalAsText);
          if (!moment.isDuration(min)) {
            min = moment.duration(1, 'seconds');
          }
        }
        return min;
      },
      cache: false
    },
    /**
     * For continuous or datetime Facets, the maximum value.
     * @memberof! Facet
     * @type {number|datetime}
     * @readonly
     */
    maxval: {
      deps: ['maxvalAsText', 'type'],
      fn: function () {
        var max;
        if (this.isContinuous) {
          max = parseFloat(this.maxvalAsText);
          if (isNaN(max)) {
            max = 100;
          }
        } else if (this.isDatetime) {
          max = moment(this.maxvalAsText, moment.ISO_8601);
          if (!max.isValid()) {
            max = moment('2020-01-01 00:00', moment.ISO_8601);
          }
        } else if (this.isDuration) {
          max = moment.duration(this.maxvalAsText);
          if (!moment.isDuration(max)) {
            max = moment.duration(100, 'seconds');
          }
        }
        return max;
      },
      cache: false
    },
    transform: {
      deps: ['type'],
      fn: function () {
        if (this.isContinuous) {
          return this.continuousTransform;
        } else if (this.isCategorial) {
          return this.categorialTransform;
        } else if (this.isDatetime) {
          return this.datetimeTransform;
        } else if (this.isDuration) {
          return this.durationTransform;
        } else if (this.isText) {
          return this.textTransform;
        }
        console.error('Invalid facet');
      },
      cache: false
    }
  },
  /**
   * setMinMax sets the range of a continuous or time facet
   */
  setMinMax: function () {
    this.collection.parent.setMinMax(this);
  },
  /**
   * setCategories finds finds all values on an ordinal (categorial) axis
   * Updates the categorialTransform of the facet
   */
  setCategories: function () {
    this.collection.parent.setCategories(this);
  }
});
