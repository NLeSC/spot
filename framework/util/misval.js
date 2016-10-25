/**
 * This module defines a single unique missing value indicator.
 * All invalid, absent, or user-indicated missing value is internally set to this value.
 * Dont change this value, as the implementation depends on it being sorted to the start of any list of numbers.
 * @example
 * var misval = require('./framework/misval');
 * if ( a === misval ) {
 *   ...
 * }
 * @module client/misval
 */

module.exports = -Number.MAX_VALUE;
