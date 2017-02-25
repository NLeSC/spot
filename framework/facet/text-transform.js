/**
 * ContinuousTransfrom defines a transformation on continuous (nummerical) data.
 * Currently linear interpolation between a set of control points is implemented.
 *
 * @class ContinuousTransform
 */
var AmpersandModel = require('ampersand-model');

module.exports = AmpersandModel.extend({
  props: {
    transformedType: {
      type: 'string',
      required: true,
      default: 'text',
      values: ['text']
    },
    transformedMin: {
      type: 'number',
      required: true,
      default: 0
    },
    transformedMax: {
      type: 'number',
      required: true,
      default: 100
    }
  },
  reset: function () {
  }
});
