/**
 * ContinuousTransfrom defines a transformation on continuous (nummerical) data.
 * Currently linear interpolation between a set of control points is implemented.
 *
 * @class ContinuousTransform
 */
var AmpersandModel = require('ampersand-model');
var Collection = require('ampersand-collection');
var misval = require('../util/misval');

var ControlPoint = require('./control-point');
var ControlPoints = Collection.extend({
  model: ControlPoint
});

/**
 * setMinMax finds the range of a continuous facet,
 * @memberof! ContinuousTransform
 * @virtual
 * @function
 */

/**
 * Calculate 100 percentiles (ie. 1,2,3,4 etc.)
 * Use the recommended method from [NIST](http://www.itl.nist.gov/div898/handbook/prc/section2/prc262.htm)
 * See also the discussion on [Wikipedia](https://en.wikipedia.org/wiki/Percentile)
 *
 * @name setPercentiles
 * @memberof! ContinuousTransform
 * @virtual
 * @function
 */

/**
 * Apply piecewise linear transformation
 * The function is constant outside the range spanned by the control points;
 * there it is set to value of the first, or the last, control points.
 * @function
 * @memberof! ContinuousTransform
 * @param {number} x
 * @returns {number} fx
 */
function transform (cps, x) {
  if (x === misval) {
    return misval;
  }

  var ncps = cps.models.length;
  if (x <= cps.models[0].x) {
    // outside range on left side
    return cps.models[0].fx;
  } else if (x >= cps.models[ncps - 1].x) {
    // outside range on right side
    return cps.models[ncps - 1].fx;
  } else {
    // inside range
    var i = 0;
    while (x > cps.models[i].x) {
      i = i + 1;
    }

    // linear interpolate between fx_i and fx_(i+1)
    var xm = cps.models[i].x;
    var xp = cps.models[i + 1].x;
    var fxm = cps.models[i].fx;
    var fxp = cps.models[i + 1].fx;
    if (xp === xm) {
      return 0.5 * (fxm + fxp);
    } else {
      return fxm + (x - xm) * (fxp - fxm) / (xp - xm);
    }
  }
}

/**
 * The inverse of the transform
 * @function
 * @memberof! ContinuousTransform
 * @param {number} fx
 * @returns {number} x
 */
function inverse (cps, fx) {
  if (fx === misval) {
    return misval;
  }

  var ncps = cps.models.length;
  if (fx <= cps.models[0].fx) {
    // outside range on left side
    return cps.models[0].x;
  } else if (fx >= cps.models[ncps - 1].fx) {
    // outside range on right side
    return cps.models[ncps - 1].x;
  } else {
    // inside range
    var i = 0;
    while (fx > cps.models[i].fx) {
      i = i + 1;
    }

    // linear interpolate between fx_i and fx_(i+1)
    var xm = cps.models[i].x;
    var xp = cps.models[i + 1].x;
    var fxm = cps.models[i].fx;
    var fxp = cps.models[i + 1].fx;
    if (fxp === fxm) {
      return 0.5 * (xm + xp);
    } else {
      return xm + (fx - fxm) * (xp - xm) / (fxp - fxm);
    }
  }
}

module.exports = AmpersandModel.extend({
  props: {
    /**
     * The type of continuous transform, can be none, or percentiles
     * Use isNone, or isPercentiles, check for transform type
     * @memberof! ContinuousTransform
     */
    type: {
      type: 'string',
      required: true,
      default: 'none',
      values: ['none', 'percentiles']
    },
    transformedType: {
      type: 'string',
      required: true,
      default: 'continuous',
      values: ['continuous']
    }
  },
  derived: {
    isNone: {
      deps: ['type'],
      fn: function () {
        return this.type === 'none';
      }
    },
    isPercentiles: {
      deps: ['type'],
      fn: function () {
        return this.type === 'percentiles';
      }
    },
    /**
     * The minimum value this facet can take, after the transformation has been applied
     * @type {number}
     * @memberof! ContinuousTransform
     */
    transformedMin: {
      deps: ['type'],
      fn: function () {
        if (this.isPercentiles) {
          return 0;
        } else if (this.isNone) {
          return this.parent.minval;
        } else {
          console.error('Invalid continuous transform');
        }
      },
      cache: false
    },
    /**
     * The maximum value this facet can take, after the transformation has been applied
     * @type {number}
     * @memberof! ContinuousTransform
     */
    transformedMax: {
      deps: ['type'],
      fn: function () {
        if (this.isPercentiles) {
          return 100;
        } else if (this.isNone) {
          return this.parent.maxval;
        } else {
          console.error('Invalid continuous transform');
        }
      },
      cache: false
    }
  },
  collections: {
    cps: ControlPoints
  },
  transform: function (x) {
    return transform(this.cps, x);
  },
  inverse: function (fx) {
    return inverse(this.cps, fx);
  },
  reset: function () {
    this.type = 'none';
    this.cps.reset();
  },
  /**
   * Calculate 100 percentiles (ie. 1,2,3,4 etc.), and initialize the `facet.continuousTransform`
   * to an approximate percentile mapping.
   * Use the recommended method from [NIST](http://www.itl.nist.gov/div898/handbook/prc/section2/prc262.htm)
   * See also the discussion on [Wikipedia](https://en.wikipedia.org/wiki/Percentile)
   * @param {Dataset} dataset
   * @param {Facet} facet
   */
  setPercentiles: function () {
    this.parent.collection.parent.setPercentiles(this.parent);
  }
});
