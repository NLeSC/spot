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
     * Unique ID for this widget
     * @memberof! Filter
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
