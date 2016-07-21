/**
 * Group
 *
 * @class Group
 */
var AmpersandModel = require('ampersand-model');

module.exports = AmpersandModel.extend({
  props: {
    /**
     * Lower limit of interval
     * @type {number}
     * @memberof! ContinuousTransform
     */
    min: ['any', true, 0],

    /**
     * Upper limit of interval
     * @type {number}
     * @memberof! ContinuousTransform
     */
    max: ['any', true, 1],

    /**
     * Number of items this transform is used
     * @type {number}
     * @memberof! ContinuousTransform
     */
    count: ['number', true, 0],

    /**
     * Label for display
     * @type {string}
     */
    label: ['string', true, 'label'],

    /**
     * A value guaranteed to be in this group, used to check if this group is currently selected.
     * @type {string|number}
     */
    value: ['any', true, null]
  },
  derived: {
    negCount: {
      deps: ['count'],
      fn: function () {
        return -this.count;
      }
    }
  }
});
