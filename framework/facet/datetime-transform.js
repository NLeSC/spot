/**
 * DatetimeTransform defines a transformation on time or dates with timezones
 *
 * @class DatetimeTransform
 */
var AmpersandModel = require('ampersand-model');
var moment = require('moment-timezone');
var util = require('../util/time');
var misval = require('../util/misval');

/**
 * setMinMax finds the range of a continuous facet,
 *
 * @name setMinMax
 * @memberof! DatetimeTransform
 * @virtual
 * @function
 */

module.exports = AmpersandModel.extend({
  props: {
    /**
     * Timezone to use when parsing, for when timezone information is absent or incorrect.
     * @memberof! DatetimeTransform
     * @type {string}
     */
    zone: ['string', true, 'ISO8601'],

    /**
     * Format indentifier to use when parsing, when not in ISO8601 format
     * Mappings are defined in util/time.js => timeParts.description
     * @memberof! DatetimeTransform
     * @type {string}
     */
    format: ['string', true, 'ISO8601'],

    /**
     * Reformats to a string using the momentjs or postgreSQL format specifiers.
     * This allows a transformation to day of the year, or day of week etc.
     * @memberof! DatetimeTransform
     * @type {string}
     */
    transformedFormat: ['string', true, 'ISO8601'],

    /**
     * Controls conversion to duration by subtracting this date
     * @memberof! DatetimeTransform
     * @type {string}
     */
    transformedReference: 'string',

    /**
     * Reference timezone for conversion from datetime to duration
     * @memberof! DatetimeTransform
     * @type {string}
     */
    transformedZone: ['string', true, 'ISO8601']

  },
  derived: {
    // reference momentjs for duration <-> datetime conversion
    referenceMoment: {
      deps: ['transformedReference', 'transformedZone'],
      fn: function () {
        var tz;
        if (this.transformedZone === 'ISO8601') {
          tz = moment.tz.guess();
        } else {
          var timeZone = util.timeZones.get(this.transformedZone, 'description');
          if (timeZone && timeZone.format) {
            tz = timeZone.format;
          } else {
            tz = moment.tz.guess();
          }
        }
        if (this.transformedReference) {
          return moment.tz(this.transformedReference, tz);
        }
        return null;
      }
    },
    /**
     * The type of the facet after the transformation has been applied
     * @memberof! DatetimeTransform
     */
    transformedType: {
      deps: ['transformedFormat', 'transformedReference'],
      fn: function () {
        if (this.transformedReference) {
          // datetime -> duration
          return 'duration';
        } else if (this.transformedFormat === 'ISO8601') {
          // datetime -> datetime
          return 'datetime';
        } else {
          // datetime -> time part
          var timePart = util.timeParts.get(this.transformedFormat, 'description');
          if (timePart && timePart.type) {
            return timePart.type;
          }
        }
        return 'datetime';
      },
      cache: false
    },
    /**
     * The minium value this facet can take, after the transformation has been applied
     * @type {number}
     * @memberof! DatetimeTransform
     */
    transformedMin: {
      deps: ['transformedType'],
      fn: function () {
        var timePart;
        if (this.transformedType === 'datetime' || this.transformedType === 'duration') {
          return this.transform(this.parent.minval);
        }
        timePart = util.timeParts.get(this.transformedFormat, 'description');
        if (timePart.calcualte) {
          return this.transform(this.parent.minval);
        } else {
          return timePart.min;
        }
      },
      cache: false
    },
    /**
     * The maximum value this facet can take, after the transformation has been applied
     * @type {number}
     * @memberof! DatetimeTransform
     */
    transformedMax: {
      deps: ['transformedType'],
      fn: function () {
        var timePart;
        if (this.transformedType === 'datetime' || this.transformedType === 'duration') {
          return this.transform(this.parent.maxval);
        }
        timePart = util.timeParts.get(this.transformedFormat, 'description');
        if (timePart.calcualte) {
          return this.transform(this.parent.maxval);
        } else {
          return timePart.max;
        }
      },
      cache: false
    }
  },

  /**
   * @function
   * @memberof! DatetimeTransform
   * @param {Object} momentjs
   * @returns {Object} momentjs
   */
  transform: function transform (inval) {
    if (typeof inval === 'undefined') {
      return misval;
    }

    var d = inval.clone();
    var timePart;

    if (this.referenceMoment) {
      // datetime -> duration
      return moment.duration(d.diff(this.referenceMoment, 'milliseconds', true), 'milliseconds');
    } else if (this.transformedFormat !== 'ISO8601') {
      timePart = util.timeParts.get(this.transformedFormat, 'description');
      if (timePart && timePart.momentFormat) {
        return d.format(timePart.momentFormat);
      }
      return d;
    } else {
      return d;
    }
  },
  reset: function () {
    this.unset(['zone', 'transformedFormat', 'transformedZone', 'transformedReference']);
  }
});
