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
var TimeTransform = require('./facet/time-transform');
var moment = require('moment-timezone');

module.exports = BaseModel.extend({
  initialize: function () {
    this.on('change:type', function (facet, newval) {
      // reset transformations on type change
      this.continuousTransform.reset();
      this.categorialTransform.reset();
      this.timeTransform.reset();

      // set default values for transformations
      // NOTE: this could be done in the transformation models using Ampersand default values,
      //       howerver, then they would show up on the model.toJSON(), making the session files
      //       much more cluttered and human-unfriendly
      if (newval === 'timeorduration') {
        facet.timeTransform.type = 'datetime';
      }
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
     * A time (or duration) transformation to apply to the data
     * @memberof! Facet
     * @type {TimeTransform}
     */
    timeTransform: TimeTransform,

    /**
     * A continuous transformation to apply to the data
     * @memberof! Facet
     * @type {ContinuousTransform}
     */
    continuousTransform: ContinuousTransform
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
    isTimeOrDuration: {
      deps: ['type'],
      fn: function () {
        return this.type === 'timeorduration';
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
        if (this.isContinuous) {
          return parseFloat(this.minvalAsText);
        } else if (this.isTimeOrDuration) {
          if (this.timeTransform.isDatetime) {
            return moment(this.minvalAsText);
          } else if (this.timeTransform.isDuration) {
            return moment.duration(this.minvalAsText);
          }
        } else if (this.isCategorial) {
          return 0;
        }
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
        if (this.isContinuous) {
          return parseFloat(this.maxvalAsText);
        } else if (this.isTimeOrDuration) {
          if (this.timeTransform.isDatetime) {
            return moment(this.maxvalAsText);
          } else if (this.timeTransform.isDuration) {
            return moment.duration(this.maxvalAsText);
          }
        } else if (this.isCategorial) {
          return 1;
        }
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
