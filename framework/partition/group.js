/**
 * A `Group` represents a value a `Facet` can take:
 * For continuous or time facets, it represents an interval.
 * For categorial facets, it is a single label.
 *
 * The `Facet.groups` collection is used for plotting, to deterime the postion along the axis.
 * Selections can be updated using a `Group`.
 *
 * @extends Base
 * @class Group
 */
var Base = require('../util/base');
var moment = require('moment');

module.exports = Base.extend({
  dataTypes: {
    'numberDatetimeOrDuration': {
      set: function (value) {
        var newValue;

        // check for momentjs objects
        if (moment.isDuration(value)) {
          return {
            val: moment.duration(value),
            type: 'numberDatetimeOrDuration'
          };
        }
        if (moment.isMoment(value)) {
          return {
            val: moment(value),
            type: 'numberDatetimeOrDuration'
          };
        }

        // try to create momentjs objects
        newValue = moment(value, moment.ISO_8601);
        if (newValue.isValid()) {
          return {
            val: newValue,
            type: 'numberDatetimeOrDuration'
          };
        }
        if (typeof value === 'string' && value[0].toLowerCase() === 'p') {
          newValue = moment.duration(value);
          return {
            val: newValue,
            type: 'numberDatetimeOrDuration'
          };
        }

        // try to set a number
        if (value === +value) {
          return {
            val: +value,
            type: 'numberDatetimeOrDuration'
          };
        }

        // failed..
        return {
          val: value,
          type: typeof value
        };
      },
      compare: function (currentVal, newVal) {
        if (currentVal instanceof moment) {
          return currentVal.isSame(newVal);
        } else {
          return +currentVal === +newVal;
        }
      }
    }
  },
  props: {
    /**
     * For continuous, datetime, or duration facets. Lower limit of interval
     * @type {number|moment}
     * @memberof! Group
     */
    min: 'numberDatetimeOrDuration',

    /**
     * For continuous, datetime, or duration facets. Upper limit of interval
     * @type {number|moment}
     * @memberof! Group
     */
    max: 'numberDatetimeOrDuration',

    /**
     * Number of times this transform is used
     * @type {number}
     * @memberof! Group
     */
    count: ['number', true, 0],

    /**
     * Label for display
     * @type {string}
     * @memberof! Group
     */
    label: ['string', true, 'label'],

    /**
     * A value guaranteed to be in this group, used to check if this group is currently selected.
     * moments and durations should be stored as moment.format() and duration.toISOString()
     * @type {string|number}
     * @memberof! Group
     */
    value: 'any',

    /**
     * Index, cached version of groups.models.indexOf(group)
     * @type {number}
     * @memberof! Group
     */
    groupIndex: 'number'
  }
});
