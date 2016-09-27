/**
 * The Aggregate class describes how to aggregate data, as described by a `Facet` into a single value.
 * For example, you can sum or average over numbers, or count the number of different labels.
 *
 * @class Aggregate
 * @extends Base
 */
var BaseModel = require('./base');

module.exports = BaseModel.extend({
  props: {
    /**
     * The ID of the facet to aggregate over
     * @memberof! Aggregate
     * @type {string}
     */
    facetId: 'string',

    /**
     * When part of a aggregates, this deterimines the ordering
     * @memberof! Aggregate
     * @type {number}
     */
    rank: 'number',

    /**
     * Operation:
     *  * `count`  count the number of elements in the group
     *  * `sum`    sum the elements in the group
     *  * `avg`    take the average of the elements in the group
     *  * `min`    minum value of the elements in the group
     *  * `max`    maximum value of the elements in the group
     * @memberof! Aggregate
     * @type {string}
     */
    operation: {
      type: 'string',
      required: true,
      default: 'count',
      values: ['count', 'avg', 'sum', 'min', 'max']
    },
    // NOTE: properties for reduction, should be a valid SQL aggregation function

    /**
     * Normalization:
     *  * `none`      data in same units as the original data
     *  * `relative`  data is in percentages of the total; for subgroups in percentage of the parent group
     * @memberof! Aggregate
     * @type {string}
     */
    normalization: {
      type: 'string',
      required: true,
      default: 'none',
      values: ['none', 'percentage']
    }
  },
  derived: {
    // operation values
    doSum: {
      deps: ['operation'],
      fn: function () {
        return this.operation === 'sum';
      }
    },
    doCount: {
      deps: ['operation'],
      fn: function () {
        return this.operation === 'count';
      }
    },
    doAverage: {
      deps: ['operation'],
      fn: function () {
        return this.operation === 'avg';
      }
    },

    // normalization values
    normalizeNone: {
      deps: ['normalization'],
      fn: function () {
        return this.normalization === 'absolute';
      }
    },
    normalizePercentage: {
      deps: ['normalization'],
      fn: function () {
        return this.normalization === 'percentage';
      }
    }
  }
});
