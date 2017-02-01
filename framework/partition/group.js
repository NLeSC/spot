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

module.exports = Base.extend({
  props: {
    /**
     * For continuous or time facets. Lower limit of interval
     * @type {number}
     * @memberof! Group
     */
    min: 'any',

    /**
     * For continuous or time facets. Upper limit of interval
     * @type {number}
     * @memberof! Group
     */
    max: 'any',

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
     * @type {string|number}
     * @memberof! Group
     */
    value: 'any'
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
