/**
 * A single control point for a contiuous transform
 *
 * @class ContinuousRule
 */
var BaseModel = require('./base');

// Data structure for mapping categorial (and textual) data on groups
module.exports = BaseModel.extend({
  props: {
    /**
     * Value
     * @type {number}
     * @memberof! ContinuousRule
     */
    x: ['number', true, 0],

    /**
     * Transformed value
     * @type {number}
     * @memberof! ContinuousRule
     */
    fx: ['number', true, 1]
  }
});
