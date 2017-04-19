/**
 * DurationTransfrom defines a transformation on duration data
 *
 * @class DurationTransform
 */
var AmpersandModel = require('ampersand-model');
var moment = require('moment-timezone');
var util = require('../util/time');

/**
 * setMinMax finds the range of a continuous facet,
 *
 * @name setMinMax
 * @memberof! DurationTransform
 * @virtual
 * @function
 */

module.exports = AmpersandModel.extend({
  props: {
    /**
     * Units of the duration
     * @memberof! DurationTransform
     * @type {string}
     */
    units: ['string', true, 'ISO8601'],

    /**
     * For durations, transforms duration to these units
     * @memberof! DurationTransform
     * @type {string}
     */
    transformedUnits: ['string', true, 'ISO8601'],

    /**
     * Transform the date to this timezone.
     * @memberof! DatetimeTransform
     * @type {string}
     */
    transformedZone: ['string', true, 'ISO8601'],

    /**
     * Controls conversion to datetime by adding this date
     * @memberof! DurationTransform
     * @type {string}
     */
    transformedReference: 'string'
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
     * @memberof! DurationTransform
     */
    transformedType: {
      deps: ['transformedFormat', 'transformedReference', 'transformedZone'],
      fn: function () {
        if (this.referenceMoment) {
          return 'datetime';
        } else if (this.transformedUnits !== 'ISO8601') {
          return 'continuous';
        } else {
          return 'duration';
        }
      },
      cache: false
    },
    /**
     * The minium value this facet can take, after the transformation has been applied
     * @type {number}
     * @memberof! DurationTransform
     */
    transformedMin: {
      deps: ['transformedType'],
      fn: function () {
        var facet = this.parent;
        if (this.transformedType === 'datetime') {
          return this.transform(facet.minval);
        } else if (this.transformedType === 'continuous') {
          return this.transform(facet.minval);
        } else {
          return facet.minval;
        }
      },
      cache: false
    },
    /**
     * The maximum value this facet can take, after the transformation has been applied
     * @type {number}
     * @memberof! DurationTransform
     */
    transformedMax: {
      deps: ['transformedType'],
      fn: function () {
        var facet = this.parent;
        if (this.transformedType === 'datetime') {
          return this.transform(facet.maxval);
        } else if (this.transformedType === 'continuous') {
          return this.transform(facet.maxval);
        } else {
          return facet.maxval;
        }
      },
      cache: false
    }
  },

  /**
   * @function
   * @memberof! DurationTransform
   * @param {Object} inval momentjs duration
   * @returns {Object} outval momentjs duration or datetime
   */
  transform: function transform (inval) {
    var units;
    if (this.referenceMoment) {
      // duration -> datetime
      return this.referenceMoment.clone().add(inval);
    } else if (this.transformedUnits !== 'ISO8601') {
      // duration -> continuous
      units = util.durationUnits.get(this.transformedUnits, 'description').momentFormat;
      return inval.as(units);
    } else {
      // no change
      return inval;
    }
  },
  reset: function () {
    this.unset(['zone', 'transformedFormat', 'transformedZone', 'transformedReference']);
  }
});
