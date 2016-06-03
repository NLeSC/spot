var Facet = require('./facet');
var misval = require('../misval');
var utildx = require('../util-crossfilter');

var moment = require('moment-timezone');
var math = require('mathjs');

// Finds the range of a continuous facet, and detect missing data indicators, fi. -9999, and set the facet properties
function getMinMaxMissing (facet) {
  var basevalueFn = facetBaseValueFn(facet);
  var dimension = utildx.crossfilter.dimension(function (d) {
    return basevalueFn(d);
  });

  var group = dimension.group(function (d) {
    var g;
    var order = 0;
    if (d === +d) {
      if (d < 0) {
        order = Math.trunc(Math.log(-d) / Math.log(10));
        g = -Math.exp(order * Math.log(10.0));
      } else if (d > 0) {
        order = Math.trunc(Math.log(d) / Math.log(10));
        g = Math.exp(order * Math.log(10.0));
      } else {
        g = 0;
      }
    } else {
      g = Infinity;
    }
    return g;
  });

  group.reduce(
    function (p, v) { // add
      var d = basevalueFn(v);
      if (d < p.min) p.min = d;
      if (d > p.max) p.max = d;
      p.count++;
      return p;
    },
    function (p, v) { // subtract
      p.count--;
      return p;
    },
    function () { // initialize
      return {min: Number.MAX_VALUE, max: -Number.MAX_VALUE, count: 0};
    }
  );

  var groups = group.top(Infinity);
  groups.sort(function compare (a, b) {
    if (a.key < b.key) return -1;
    if (a.key > b.key) return 1;
    return 0;
  });
  dimension.dispose();

  var min = Number.MAX_VALUE;
  var max = -Number.MAX_VALUE;
  var missing = [];

  var i = 0;
  // minimum value:
  // 1) first bin with more than one distinct value
  // 2) separated with a gap of more than 2 orders of magnitude than the rest
  if (groups.length > 1) {
    if ((Math.abs(groups[0].value.max / groups[1].value.min) > 1000.0) && groups[1].key !== Infinity) {
      missing.push(groups[i].value.min.toString());
      i++;
    }
  }
  min = groups[i].value.min;

  // maximum value:
  // 1) last bin with more than one distinct value
  // 2) separated with a gap of more than 2 orders of magnitude than the rest
  if (groups.length > 1) {
    i = groups.length - 1;
    if (groups[i].key === Infinity && i > 0) i--;
    if (i > 1) {
      if (Math.abs(groups[i].value.min / groups[i - 1].value.max) > 1000.0) {
        missing.push(groups[i].value.min.toString());
        i--;
      }
    }
  }
  max = groups[i].value.max;
  missing = JSON.stringify(missing);

  facet.minvalAsText = min.toString();
  facet.maxvalAsText = max.toString();
  facet.misvalAsText = 'Missing';
}

// Find all values on an ordinal (categorial) axis, and set the facet properties
function getCategories (facet) {
  var basevalueFn = facetBaseValueFn(facet);
  var dimension = utildx.crossfilter.dimension(function (d) {
    return basevalueFn(d);
  });

  var group = dimension.group(function (d) {
    return d;
  });
  group.reduce(
    function (p, v) { // add
      p['1'].count++;
      return p;
    },
    function (p, v) { // subtract
      p['1'].count--;
      return p;
    },
    function () { // initialize
      return {'1': {count: 0, sum: 0}};
    }
  );

  var data = utildx.unpackArray(group.top(Infinity));
  dimension.dispose();

  data.sort(function compare (a, b) {
    if (a.key < b.key) return -1;
    if (a.key > b.key) return 1;
    return 0;
  });

  var categories = [];
  data.forEach(function (d) {
    // NOTE: numbers are parsed: so not {key:'5', 20} but {key:5, value: 20}
    var keyAsString = d.key.toString();

    var groupAsString;
    if (keyAsString === misval) {
      groupAsString = facet.misval[0];
    } else {
      groupAsString = keyAsString;
    }
    categories.push({category: keyAsString, count: d.value['1'].count, group: groupAsString});
  });

  facet.categories.reset(categories);
}

// ************************************************
// Base value for given facet
// ************************************************

function facetBaseValueFn (facet) {
  var accessor;
  if (facet.isProperty) {
    // Nested properties can be accessed in javascript via the '.'
    // so we implement it the same way here.
    var path = facet.accessor.split('.');

    if (path.length === 1) {
      // Use a simple direct accessor, as it is probably faster than the more general case
      // and it was implemented already
      accessor = function (d) {
        var value = misval;
        if (d.hasOwnProperty(facet.accessor)) {
          value = d[facet.accessor];

          if (facet.misval.indexOf(value) > -1 || value === null) {
            value = misval;
          }
        }

        if (facet.isCategorial) {
          if (value instanceof Array) {
            return value;
          } else {
            return [value];
          }
        } else if (facet.isContinuous) {
          return parseFloat(value);
        }
        return value;
      };
    } else {
      // Recursively follow the crumbs to the desired property
      accessor = function (d) {
        var i = 0;
        var value = d;

        for (i = 0; i < path.length; i++) {
          if (value.hasOwnProperty(path[i])) {
            value = value[path[i]];
          } else {
            value = misval;
            break;
          }
        }

        if (facet.misval.indexOf(value) > -1 || value === null) {
          value = misval;
        }
        if (facet.isCategorial) {
          if (value.length) {
            return value;
          } else {
            return [value];
          }
        } else if (facet.isContinuous) {
          return parseFloat(value);
        }
        return value;
      };
    }
  } else if (facet.isMath) {
    var formula = math.compile(facet.accessor);

    accessor = function (d) {
      try {
        var value = formula.eval(d);
        return value;
      } catch (e) {
        return misval;
      }
    };
  }

  if (facet.isTime) {
    if (facet.isDuration) {
      var durationFormat = facet.baseValueTimeFormat;
      return function (d) {
        var value = accessor(d);
        if (value !== misval) {
          return moment.duration(parseFloat(value), durationFormat);
        }
        return misval;
      };
    } else if (facet.isDatetime) {
      var timeFormat = facet.baseValueTimeFormat;
      var timeZone = facet.baseValueTimeZone;
      return function (d) {
        var value = accessor(d);
        if (value !== misval) {
          var m;
          if (timeFormat.length > 0) {
            m = moment(value, timeFormat);
          } else {
            m = moment(value);
          }
          if (timeZone.length > 0) {
            m.tz(timeZone);
          }
          return m;
        }
        return misval;
      };
    } else {
      console.error('Time base type not supported for facet', facet);
    }
  } else if (facet.isContinuous || facet.isCategorial) {
    return accessor;
  } else {
    console.error('Facet kind not implemented in facetBaseValueFn: ', facet);
  }
}

// ********************************************************
// Facet transform utility function
// ********************************************************

// Usecase: transformPercentiles
// Calculate 100 percentiles (ie. 1,2,3,4 etc.)
// approximate the nth percentile by taking the data at index:
//     i ~= floor(0.01 * n * len(data))
function getPercentiles (facet) {
  var basevalueFn = facetBaseValueFn(facet);
  var dimension = utildx.crossfilter.dimension(basevalueFn);
  var data = dimension.bottom(Infinity);

  var percentiles = [];
  var p, i, value;

  // drop missing values, which should be sorted at the start of the array
  i = 0;
  while (basevalueFn(data[i]) === misval) i++;
  data.splice(0, i);

  for (p = 0; p < 101; p++) {
    i = Math.trunc(p * 0.01 * (data.length - 1));
    value = basevalueFn(data[i]);
    percentiles.push({x: value, p: p});
  }

  dimension.dispose();

  return percentiles;
}

// Usecase: transformExceedances
// Calculate value where exceedance probability is one in 10,20,30,40,50,
// and the same for -exceedance -50, -60, -70, -80, -90, -99, -99.9, -99.99, ... percent
// Approximate from data: 1 in 10 is larger than value at index trunc(0.1 * len(data))
function getExceedances (facet) {
  var basevalueFn = facetBaseValueFn(facet);
  var dimension = utildx.crossfilter.dimension(basevalueFn);
  var data = dimension.bottom(Infinity);
  var exceedance;
  var i, value, oom, mult, n;

  // drop missing values, which should be sorted at the start of the array
  i = 0;
  while (basevalueFn(data[i]) === misval) i++;
  data.splice(0, i);

  // percentile
  // P(p)=x := p% of the data is smaller than x, (100-p)% is larger than x
  //
  // exceedance:
  // '1 in n' value, or what is the value x such that the probabiltiy drawing a value y with y > x is 1 / n

  exceedance = [{x: basevalueFn(data[Math.trunc(data.length / 2)]), e: 2}];

  // order of magnitude
  oom = 1;
  mult = 3;
  while (mult * oom < data.length) {
    n = oom * mult;

    // exceedance
    i = data.length - Math.trunc(data.length / n);
    value = basevalueFn(data[i]);

    // only add it if it is different form the previous value
    if (value > exceedance[exceedance.length - 1].x) {
      exceedance.push({x: value, e: n});
    }

    // subceedance (?)
    i = data.length - i;
    value = basevalueFn(data[i]);

    // only add it if it is different form the previous value
    if (value < exceedance[0].x) {
      exceedance.unshift({x: value, e: -n});
    }

    mult++;
    if (mult === 10) {
      oom = oom * 10;
      mult = 1;
    }
  }
  dimension.dispose();
  return exceedance;
}

// **********************************************************************
// Create a function that returns the transformed value for this facet
// **********************************************************************

function facetValueFn (facet) {
  if (facet.isContinuous) {
    return continuousValueFn(facet);
  } else if (facet.isCategorial) {
    return categorialValueFn(facet);
  } else if (facet.isTime) {
    return timeValueFn(facet);
  }

  console.error('facetValueFn not implemented for facet type: ', facet);
}

function continuousValueFn (facet) {
  // get base value function
  var baseValFn = facetBaseValueFn(facet);

  // Parse numeric value from base value
  if (facet.transformNone) {
    return function (d) {
      var val = baseValFn(d);
      if (isNaN(val) || val === Infinity || val === -Infinity) {
        return misval;
      }
      return val;
    };

  // Calulate percentiles, and setup mapping
  // Approximate precentiles:
  //  a) sort the data small to large
  //  b) find the nth percentile by taking the data at index:
  //     i ~= floor(0.01 * n * len(data))
  } else if (facet.transformPercentiles) {
    var percentiles = getPercentiles(facet);
    var npercentiles = percentiles.length;

    return function (d) {
      var val = baseValFn(d);
      if (val < percentiles[0].x) {
        return 0;
      } else if (val > percentiles[npercentiles - 1]) {
        return 100;
      }

      var i = 0;
      while (val > percentiles[i].x) {
        i++;
      }
      return percentiles[i].p;
    };

  // Calulate exceedances, and setup mapping
  // Approximate exceedances:
  //  a) sort the data small to large
  //  b) 1 in 3 means at 2/3rds into the data: trunc((3-1) * data.length/3)
  } else if (facet.transformExceedances) {
    var exceedances = getExceedances(facet);
    var nexceedances = exceedances.length;

    return function (d) {
      var val = baseValFn(d);

      if (val <= exceedances[0].x) {
        return exceedances[0].e;
      }

      if (val >= exceedances[nexceedances - 1].x) {
        return exceedances[nexceedances - 1].e;
      }

      var i = 0;
      while (val > exceedances[i].x) {
        i++;
      }
      return exceedances[i].e;
    };
  }
}

function categorialValueFn (facet) {
  // get base value function
  var baseValFn = facetBaseValueFn(facet);

  return function (d) {
    // Map categories to a set of user defined categories
    var relabel = function (hay) {
      // default to the raw value
      var val = hay;

      // Parse facet.categories to match against category_regexp to find group
      facet.categories.some(function (cat) {
        if (cat.category === hay) {
          val = cat.group;
          return true;
        } else {
          return false;
        }
      // if(cat.category_regexp.test(hay)) {
      //     val = cat.group
      //     return true
      // }
      // else {
      //     return false
      // }
      });
      return val;
    };

    var val = baseValFn(d);

    var i;
    for (i = 0; i < val.length; i++) {
      val[i] = relabel(val[i]);
    }

    // sort alphabetically
    val.sort();

    return val;
  };
}

function timeValueFn (facet) {
  // get base value function
  var baseValFn = facetBaseValueFn(facet);
  var durationFormat;
  var referenceMoment;

  if (facet.isDatetime) {
    if (facet.transformNone) {
      // datetime -> datetime
      return baseValFn;
    } else if (facet.transformToDuration) {
      referenceMoment = moment(facet.transformTimeReference);
      return function (d) {
        // see:
        //  http://momentjs.com/docs/#/displaying/difference/
        //  http://momentjs.com/docs/#/durations/creating/
        var m = baseValFn(d);
        if (m === misval) {
          return m;
        }
        return moment.duration(m.diff(referenceMoment));
      };
    } else if (facet.transformTimezone) {
      return function (d) {
        // see:
        //  http://momentjs.com/timezone/docs/#/using-timezones/
        var m = baseValFn(d);
        if (m === misval) {
          return m;
        }
        return m.tz(facet.transformTimeZone);
      };
    } else {
      console.error('Time transform not implemented for facet', facet);
    }
  } else if (facet.isDuration) {
    if (facet.transformNone) { // duration -> duration
      durationFormat = facet.baseValueTimeFormat;
      return function (d) {
        var m = baseValFn(d);
        if (m === misval) {
          return m;
        }
        return m.as(durationFormat);
      };
    } else if (facet.transformToDuration) {
      // duration -> duration in different units
      durationFormat = facet.transformTimeUnits;
      return function (d) {
        var m = baseValFn(d);
        if (m === misval) {
          return m;
        }
        return m.as(durationFormat);
      };
    } else if (facet.transformToDatetime) {
      // duration -> datetime
      referenceMoment = moment(facet.transformTimeReference);
      return function (d) {
        var m = baseValFn(d);
        if (m === misval) {
          return m;
        }
        var result = referenceMoment.clone();
        return result.add(m);
      };
    } else {
      console.error('Time transform not implemented for facet', facet, facet.transform);
    }
  } else {
    console.error('Time type not implemented for facet', facet);
  }
}

// ********************************************************
// Create a function that returns group value for a facet
// ********************************************************

function facetGroupFn (facet) {
  if (facet.displayContinuous) {
    return continuousGroupFn(facet);
  } else if (facet.displayCategorial) {
    return categorialGroupFn(facet);
  } else if (facet.displayTime) {
    return timeGroupFn(facet);
  }

  console.error('Group function not implemented for facet', facet);
}

function continuousGroupFn (facet) {
  var bins = facet.bins;
  var nbins = bins.length;

  // FIXME: use some bisection to speed up
  return function (d) {
    var i;
    if (d < bins[0].group[0] || d > bins[nbins - 1].group[1]) {
      return misval;
    }

    i = 0;
    while (d > bins[i].group[1]) {
      i++;
    }
    return bins[i].label;
  };
}

function timeGroupFn (facet) {
  // Round the time to the specified resolution
  // see:
  //  http://momentjs.com/docs/#/manipulating/start-of/
  //  http://momentjs.com/docs/#/displaying/as-javascript-date/
  var timeBin = facet.groupingTimeFormat;
  var scale = function (d) {
    if (d === misval) {
      return d;
    }
    var datetime = d.clone();
    var result = datetime.startOf(timeBin);
    return result;
  };
  scale.domain = function () {
    return [moment(facet.minvalAsText), moment(facet.maxvalAsText)];
  };
  return scale;
}

function categorialGroupFn (facet) {
  // Don't do any grouping; that is done in the step from base value to value.
  // Matching of facet value and group could lead to a different ordering,
  // which is not allowed by crossfilter
  return function (d) {
    return d;
  };
}

module.exports = Facet.extend({
  props: {
    modelType: ['string', 'true', 'crossfilter']
  },
  derived: {
    // Vritual methods on the facet
    getMinMaxMissing: {
      fn: function () {
        return getMinMaxMissing(this);
      },
      cache: false
    },
    getCategories: {
      fn: function () {
        return getCategories(this);
      },
      cache: false
    },

    // Private methods for crossfilter facets
    baseValue: {
      fn: function () {
        return facetBaseValueFn(this);
      },
      cache: false
    },
    value: {
      fn: function () {
        return facetValueFn(this);
      },
      cache: false
    },
    group: {
      fn: function () {
        return facetGroupFn(this);
      },
      cache: false
    }
  }
});
