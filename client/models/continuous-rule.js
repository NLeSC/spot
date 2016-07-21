/**
 * Continuous transfroms
 *
 * @class ContinuousTransform
 */
var BaseModel = require('./base');

// Data structure for mapping categorial (and textual) data on groups
module.exports = BaseModel.extend({
  props: {
    /**
     * Value
     * @type {number}
     * @memberof! ContinuousTransform
     */
    x: ['number', true, 0],

    /**
     * Transformed value
     * @type {number}
     * @memberof! ContinuousTransform
     */
    fx: ['number', true, 1]
  }
});
