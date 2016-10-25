/**
 * Base class
 *
 * Implements unique ID per instance. It is set once, and can not be updated.
 * An ID is generated during initialization; however it is included in the (de-)serializing of the object.
 * @class Base
 */
var AmpersandModel = require('ampersand-model');

// see discussion here: https://gist.github.com/gordonbrander/2230317
function uniqueID () {
  function chr4 () {
    return Math.random().toString(16).slice(-4);
  }
  return chr4() + chr4() +
    '-' + chr4() +
    '-' + chr4() +
    '-' + chr4() +
    '-' + chr4() + chr4() + chr4();
}

module.exports = AmpersandModel.extend({
  props: {
    /**
     * Unique ID for this class
     * @memberof! Base
     * @readonly
     * @type {ID}
     */
    id: {
      type: 'string',
      default: function () {
        return uniqueID();
      },
      setonce: true
    }
  }
});
