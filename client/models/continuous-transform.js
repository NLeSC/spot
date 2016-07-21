/**
 * ContinuousTransfrom defines a transformation on continuous (nummerical) data.
 *
 * @class ContinuousTransform
 */
var Collection = require('ampersand-collection');
var Rule = require('./continuous-rule');
var misval = require('../misval');

/**
 * Apply piecewise linear transformation
 * is constant outside domain TODO: linear, exponential extrapolation
 * @function
 * @memberof! ContinuousTransform
 * @param {number} x
 * @returns {number} fx
 */
function transform (rules, x) {
  if (x === misval) {
    return misval;
  }

  var nrules = rules.models.length;
  if (x <= rules.models[0].x) {
    // outside range on left side
    return rules.models[0].fx;
  } else if (x >= rules.models[nrules - 1].x) {
    // outside range on right side
    return rules.models[nrules - 1].fx;
  } else {
    // inside range
    var i = 0;
    while (x > rules.models[i].x) {
      i = i + 1;
    }

    // linear interpolate between fx_i and fx_(i+1)
    var xm = rules.models[i].x;
    var xp = rules.models[i + 1].x;
    var fxm = rules.models[i].fx;
    var fxp = rules.models[i + 1].fx;
    if (xp === xm) {
      return 0.5 * (fxm + fxp);
    } else {
      return fxm + (x - xm) * (fxp - fxm) / (xp - xm);
    }
  }
}

module.exports = Collection.extend({
  model: Rule,
  transform: function (x) {
    return transform(this, x);
  }
});
