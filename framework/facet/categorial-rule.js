/**
 * Categorial Rule abstracts a single matching rule
 *
 * @class CategorialRule
 */
var Base = require('../util/base');

// Data structure for mapping categorial (and textual) data on groups
module.exports = Base.extend({
  props: {
    /**
     * string or string format of regexp to match data against.
     * To use a regular expression, start and end the string with a slash, '/'.
     * Options can be appedended, notably 'i' for case insensitive matching.
     * The first captured group can be used in the group, see below.
     * Examples
     * 1. 'hello' matches 'hello', not 'hello world'
     * 2. '/hello/' matches 'hello world', but not 'Hello world'
     * 3. '/hello/i' matches 'I say Hello'
     * @type {string}
     * @memberof! CategorialRule
     */
    expression: ['string', false, 'Missing'],

    /**
     * Number of items this transform is used
     * @type {number}
     * @memberof! CategorialRule
     */
    count: ['number', false, 0],

    /**
     * Name of the group this is mapped to. The special substring $1 is replaced by the first captured group,
     * in example 4 above, with group set to 'He says $1', the match results in 'He says goodbye'
     * @type {string}
     * @memberof! CategorialRule
     */
    group: ['string', false, 'Missing']
  },
  derived: {

    /**
     * Match function
     * @memberof! CategorialRule
     * @function
     * @param {string} text The text to match
     * @returns {string|false} group The group label if matching, else false
     */
    match: {
      deps: ['expression', 'group'],
      fn: function () {
        var that = this;

        var reFormat = new RegExp(/^\/(.*)\/([gimuy]*)$/);
        var match = reFormat.exec(that.expression);

        if (match) {
          // if the expression is in the form of /<text>/<flags>, it is a regular expression, compile it
          var exp = RegExp(match[1], match[2]);
          return function (text) {
            var m = exp.exec(text);
            if (m) {
              that.count++;
              return that.group;
              // return that.group.replace('$1', m[1]);
            } else {
              return false;
            }
          };
        } else {
          // otherwise do matching using '==='
          return function (text) {
            if (text === that.expression) {
              that.count++;
              return that.group;
            } else {
              return false;
            }
          };
        }
      }
    }
  }
});
