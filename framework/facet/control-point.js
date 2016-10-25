/**
 * A single control point for a continuous transform
 *
 * @class ControlPoint
 */
var BaseModel = require('../util/base');

// Data structure for mapping categorial (and textual) data on groups
module.exports = BaseModel.extend({
  props: {
    /**
     * Value
     * @type {number}
     * @memberof! ContinuousRule
     */
    x: 'number',

    /**
     * Transformed value
     * @type {number}
     * @memberof! ContinuousRule
     */
    fx: 'number'
  }
});
