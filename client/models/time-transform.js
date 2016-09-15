/**
 * TimeTransfrom defines a transformation on time or duration data
 *
 * @class TimeTransform
 */
var AmpersandModel = require('ampersand-model');
var moment = require('moment-timezone');
var util = require('../util-time');

/**
 * setMinMax finds the range of a continuous facet,
 *
 * @name setMinMax
 * @memberof! TimeTransform
 * @virtual
 * @function
 */

module.exports = AmpersandModel.extend({
  props: {
    /**
     * Timezone to use when parsing, for when timezone information is absent or incorrect.
     * @memberof! TimeTransform
     * @type {string}
     */
    zone: 'string',

    /**
     * Type of datetime object: a datetime or a duration
     * Do not use directly, but use `isDatetime` and `isDuration` methods.
     * @memberof! TimeTransform
     * @type {string}
     */
    type: {
      type: 'string',
      default: 'datetime',
      values: ['datetime', 'duration']
    },

    /**
     * For datetimes, reformats to a string using the momentjs or postgreSQL format specifiers.
     * This allows a transformation to day of the year, or day of week etc.
     * @memberof! TimeTransform
     * @type {string}
     */
    transformedFormat: ['string', true, 'NONE'],

    /**
     * For durations, transforms duration to these units
     * @memberof! TimeTransform
     * @type {string}
     */
    transformedUnits: ['string', true, 'seconds'],

    /**
     * For datetimes, transform the date to this timezone.
     * @memberof! TimeTransform
     * @type {string}
     */
    transformedZone: ['string', true, 'NONE'],

    /**
     * Controls conversion between datetimes and durations by adding or subtracting this date
     * @memberof! TimeTransform
     * @type {string}
     */
    transformedReference: 'string'
  },
  derived: {
    // properties for: base-value-time
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
    // reference momentjs for duration <-> datetime conversion
    referenceMoment: {
      deps: ['transformedZone', 'transformedReference'],
      fn: function () {
        var tz;
        if (this.transformedZone !== 'NONE') {
          tz = this.transformedZone;
        } else {
          tz = moment.tz.guess();
        }

        if (this.transformedReference) {
          return moment.tz(this.transformedReference, tz);
        }
        return null;
      }
    },
    /**
     * The type of the facet after the transformation has been applied
     * @memberof! TimeTransform
     */
    transformedType: {
      deps: ['type', 'transformedFormat'],
      fn: function () {
        if (this.isDatetime) {
          if (this.transformedReference) {
            // datetime -> duration
            return 'continuous';
          } else {
            // datetime -> time part
            var timePart = util.clientTimeParts.get(this.transformedFormat, 'format');
            return timePart.type;
          }
        } else if (this.isDuration) {
          if (this.transformedReference) {
            return 'datetime';
          } else {
            return 'continuous';
          }
        }
      },
      cache: false
    },
    /**
     * The miniumu value this facet can take, after the transformation has been applied
     * @type {number}
     * @memberof! TimeTransform
     */
    transformedMin: {
      deps: ['type', 'transformedFormat'],
      fn: function () {
        var facet = this.parent;
        var min;

        if (this.isDatetime) {
          if (this.transformedReference) {
            // datetime -> duration
            var ref = this.referenceMoment;
            min = facet.minval;
            var diff = moment.duration(min.diff(ref));
            return diff.as(this.transformedUnits);
          } else {
            // datetime -> time part
            var timePart = util.clientTimeParts.get(this.transformedFormat, 'format');
            if (timePart.type === 'continuous') {
              return timePart.min;
            } else if (timePart.type === 'datetime') {
              return facet.minval;
            }
          }
        } else if (this.isDuration) {
          if (this.transformedReference) {
            // duration -> datetime
            min = this.referenceMoment;
            return min.add(facet.minval);
          } else {
            // duration
            min = facet.minval;
            return min.as(this.transformedUnits);
          }
        }
        return 0;
      },
      cache: false
    },
    /**
     * The maximum value this facet can take, after the transformation has been applied
     * @type {number}
     * @memberof! TimeTransform
     */
    transformedMax: {
      deps: ['type', 'transformedFormat'],
      fn: function () {
        var facet = this.parent;
        var max;

        if (this.isDatetime) {
          if (this.transformedReference) {
            // datetime -> duration
            var ref = this.referenceMoment;
            max = facet.maxval;
            var diff = moment.duration(max.diff(ref));
            return diff.as(this.transformedUnits);
          } else {
            // datetime -> time part
            var timePart = util.clientTimeParts.get(this.transformedFormat, 'format');
            if (timePart.type === 'continuous') {
              return timePart.max;
            } else if (timePart.type === 'datetime') {
              return facet.maxval;
            }
          }
        } else if (this.isDuration) {
          if (this.transformedReference) {
            // duration -> datetime
            max = this.referenceMoment;
            return max.add(facet.maxval);
          } else {
            // duration
            max = facet.maxval;
            return max.as(this.transformedUnits);
          }
        }
        return 0;
      },
      cache: false
    }
  },
  session: {
    // do not do any transformations that change facet or partition type
    forceDatetime: ['boolean', true, false]
  },

  /**
   * @function
   * @memberof! TimeTransform
   * @param {Object} momentjs
   * @returns {Object} momentjs
   */
  transform: function transform (inval) {
    if (this.isDatetime) {
      if (this.referenceMoment) {
        // datetime -> duration
        return inval.diff(this.referenceMoment, this.transformedUnits, true);
      } else if (this.transformedZone !== 'NONE') {
        // change time zone
        return inval.tz(this.transformedZone);
      } else if (this.transformedFormat !== 'NONE' && this.forceDatetime === false) {
        // Print the momentjs object as string, and as it is now a categorial type, wrap it in an array
        // Format specification here http://momentjs.com/docs/#/displaying/format/
        return inval.format(this.transformedFormat);
      } else {
        return inval;
      }
    } else if (this.isDuration) {
      if (this.referenceMoment && this.forceDatetime === false) {
        // duration -> datetime
        return this.referenceMoment.clone().add(inval);
      } else {
        // no change
        return inval.as(this.transformedUnits);
      }
    } else {
      console.error('Time type not implemented for timeTransform', this);
    }
  },
  reset: function () {
    this.unset(['zone', 'type', 'transformedFormat', 'transformedZone', 'transformedReference']);
  }
});

