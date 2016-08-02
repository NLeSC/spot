/**
 * TimeTransfrom defines a transformation on time or duration data
 *
 * @class TimeTransform
 */
var AmpersandModel = require('ampersand-model');
var moment = require('moment-timezone');

module.exports = AmpersandModel.extend({
  props: {
    /**
     * When datetime or durations are not in ISO8601 format, this format will be used to parse the datetime
     * Implementation depends on the dataset. Crossfilter dataset uses momentjs
     * @memberof! TimeTransform
     * @type {string}
     */
    format: 'string',

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
     * For durations, sets the new units to use (years, months, weeks, days, hours, minutes, seconds, miliseconds). Data will be transformed.
     * For datetimes, reformats to a string using the momentjs or postgresql format specifiers.
     * This allows a transformation to day of the year, or day of week etc.
     * @memberof! TimeTransform
     * @type {string}
     */
    transformedFormat: 'string',

    /**
     * For datetimes, transform the date to this timezone.
     * @memberof! TimeTransform
     * @type {string}
     */
    transformedZone: 'string',

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
    transformedType: {
      deps: ['type', 'transformedReference', 'transformedFormat'],
      fn: function () {
        if (this.type === 'duration') {
          if (this.transformedReference) {
            return 'datetime';
          } else {
            return 'continuous';
          }
        } else if (this.type === 'datetime') {
          if (this.transformedReference) {
            return 'continuous'; // ie. a duration
          } else if (this.transformedFormat) {
            return 'categorial'; // weekday, etc.
          } else {
            return 'datetime';
          }
        }
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
    }
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
      } else if (this.transformedFormat) {
        // Print the momentjs object as string, and as it is now a categorial type, wrap it in an array
        // Format specification here http://momentjs.com/docs/#/displaying/format/
        return [inval.format(this.transformedFormat)];
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
    this.unset(['format', 'zone', 'type', 'transformedFormat', 'transformedZone', 'transformedReference']);
  }
});

