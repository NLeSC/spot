/**
 * TimeTransfrom defines a transformation on time or duration data
 *
 * @class TimeTransform
 */
var AmpersandModel = require('ampersand-model');
var moment = require('moment-timezone');
var util = require('../util-time');

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
      values: ['datetime', 'duration']
    },

    /**
     * For durations, sets the new units to use (years, months, weeks, days, hours, minutes, seconds, milliseconds). Data will be transformed.
     * For datetimes, reformats to a string using the momentjs or postgreSQL format specifiers.
     * This allows a transformation to day of the year, or day of week etc.
     * @memberof! TimeTransform
     * @type {string}
     */
    transformedFormat: ['string', true, ''],

    /**
     * For datetimes, transform the date to this timezone.
     * @memberof! TimeTransform
     * @type {string}
     */
    transformedZone: ['string', true, ''],

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
        if (this.transformedZone) {
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
    // transformed properties
    transformedType: {
      deps: ['type', 'transformedFormat'],
      fn: function () {
        if (this.type === 'datetime') {
          if (this.transformedReference) {
            // datetime -> duration
            return 'duration';
          } else {
            // datetime -> time part
            var timePart = util.clientTimeParts.get(this.transformedFormat, 'format');
            return timePart.type;
          }
        } else if (this.type === 'duration') {
          if (this.transformedReference) {
            return 'datetime';
          } else {
            return 'duration';
          }
        }
      },
      cache: false
    },
    transformedMin: {
      deps: ['type', 'transformedFormat'],
      fn: function () {
        var facet = this.parent;

        if (this.type === 'datetime') {
          if (this.transformedReference) {
            // datetime -> duration
            // TODO
            return 0;
          } else {
            // datetime -> time part
            var timePart = util.clientTimeParts.get(this.transformedFormat, 'format');
            if (timePart.type === 'continuous') {
              return timePart.min;
            } else if (timePart.type === 'datetime') {
              return facet.minval;
            }
          }
        } else if (this.type === 'duration') {
          if (this.transformedReference) {
            // duration -> datetime
            // TODO
            return 0;
          } else {
            // duration
            // TODO
            return 0;
          }
        }
        return 0;
      },
      cache: false
    },
    transformedMax: {
      deps: ['type', 'transformedFormat'],
      fn: function () {
        var facet = this.parent;

        if (this.type === 'datetime') {
          if (this.transformedReference) {
            // datetime -> duration
            // TODO
            return 0;
          } else {
            // datetime -> time part
            var timePart = util.clientTimeParts.get(this.transformedFormat, 'format');
            if (timePart.type === 'continuous') {
              return timePart.max;
            } else if (timePart.type === 'datetime') {
              return facet.maxval;
            }
          }
        } else if (this.type === 'duration') {
          if (this.transformedReference) {
            // duration -> datetime
            // TODO
            return 0;
          } else {
            // duration
            // TODO
            return 0;
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
        return inval.diff(this.referenceMoment, this.transformedFormat, true);
      } else if (this.transformedZone) {
        // change time zone
        return inval.tz(this.transformedZone);
      } else if (this.transformedFormat && this.forceDatetime === false) {
        // Print the momentjs object as string, and as it is now a categorial type, wrap it in an array
        // Format specification here http://momentjs.com/docs/#/displaying/format/
        return inval.format(this.transformedFormat);
      } else {
        return inval;
      }
    } else if (this.isDuration) {
      if (this.referenceMoment) {
        // duration -> datetime
        return this.referenceMoment.clone().add(inval);
      } else if (this.transformedFormat) {
        // change units
        return inval.as(this.transformedFormat);
      } else {
        // no change
        return inval;
      }
    } else {
      console.error('Time type not implemented for timeTransform', this);
    }
  },
  clear: function () {
    this.unset(['zone', 'type', 'transformedFormat', 'transformedZone', 'transformedReference']);
  }
});

