/*
 * A dataset backed by Crossfilter, ie. fully client side filtering without the need for a server or database.
 * @module client/dataset-crossfilter
 */
var Dataset = require('./dataset');
var Facet = require('./facet');

var utildx = require('../util-crossfilter');
var misval = require('../misval');

function sortByKey (a, b) {
  if (a.key < b.key) return -1;
  if (a.key > b.key) return 1;
  return 0;
}

/*
 * Crossfilter instance, see [here](http://square.github.io/crossfilter/)
 * @memberof! Dataset
 */
var crossfilter = require('crossfilter')([]);

/*
 * setMinMaxMissing finds the range of a continuous facet, and detect missing data indicators, fi. -9999
 * Updates the minval, maxval, and misval properties of the facet
 * @memberof! Dataset
 * @param {Dataset} dataset
 * @param {Facet} facet
 */
function setMinMaxMissing (dataset, facet) {
  var basevalueFn = utildx.baseValueFn(facet);
  var dimension = dataset.crossfilter.dimension(basevalueFn);

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
  groups.sort(sortByKey);
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

/*
 * setCategories finds finds all values on an ordinal (categorial) axis
 * Updates the categories property of the facet
 *
 * @memberof Dataset
 * @param {Dataset} dataset
 * @param {Facet} facet
 */
function setCategories (dataset, facet) {
  var basevalueFn = utildx.baseValueFn(facet);
  var dimension = dataset.crossfilter.dimension(function (d) {
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

  data.sort(sortByKey);

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

/*
 * Calculate 100 percentiles (ie. 1,2,3,4 etc.)
 * Use the recommended method from [NIST](http://www.itl.nist.gov/div898/handbook/prc/section2/prc262.htm)
 * See also the discussion on [Wikipedia](https://en.wikipedia.org/wiki/Percentile)
 * @param {Dataset} dataset
 * @param {Facet} facet
 */
function getPercentiles (dataset, facet) {
  var basevalueFn = utildx.baseValueFn(facet);
  var dimension = dataset.crossfilter.dimension(basevalueFn);
  var data = dimension.bottom(Infinity);
  dimension.dispose();

  var percentiles = [];
  var p, x, i, value;

  // drop missing values, which should be sorted at the start of the array
  i = 0;
  while (basevalueFn(data[i]) === misval) i++;
  data.splice(0, i);

  for (p = 1; p < 100; p++) {
    x = (p * 0.01) * (data.length + 1) - 1; // indexing starts at zero, not at one
    i = Math.trunc(x);
    value = (1 - x + i) * basevalueFn(data[i]) + (x - i) * basevalueFn(data[i + 1]);
    percentiles.push({x: value, p: p});
  }
  return percentiles;
}

/*
 * Calculate value where exceedance probability is one in 10,20,30,40,50,
 * and the same for -exceedance -50, -60, -70, -80, -90, -99, -99.9, -99.99, ... percent
 * Approximate from data: 1 in 10 is larger than value at index trunc(0.1 * len(data))
 * @param {Dataset} dataset
 * @param {Facet} facet
 */
function getExceedances (dataset, facet) {
  var basevalueFn = utildx.baseValueFn(facet);
  var dimension = dataset.crossfilter.dimension(basevalueFn);
  var data = dimension.bottom(Infinity);
  dimension.dispose();

  var exceedances = [];
  var i, oom, mult, n, value, valuep, valuem;

  // drop missing values, which should be sorted at the start of the array
  i = 0;
  while (basevalueFn(data[i]) === misval) i++;
  data.splice(0, i);

  // exceedance:
  // '1 in n' value, or what is the value x such that the probabiltiy drawing a value y with y > x is 1 / n

  if (data.length % 2 === 0) {
    valuem = basevalueFn(data[(data.length / 2) - 1]);
    valuep = basevalueFn(data[(data.length / 2)]);
    value = 0.5 * (valuem + valuep);
  } else {
    value = basevalueFn(data[(Math.trunc(data.length / 2))]);
  }
  exceedances = [{x: value, e: 2}];

  // order of magnitude
  oom = 1;
  mult = 3;
  while (mult * oom < data.length) {
    n = oom * mult;

    // exceedance
    i = data.length - Math.trunc(data.length / n) - 1;
    value = basevalueFn(data[i]);

    exceedances.push({x: value, e: n});

    // subceedance (?)
    i = data.length - i - 1;
    value = basevalueFn(data[i]);

    exceedances.unshift({x: value, e: -n});

    mult++;
    if (mult === 10) {
      oom = oom * 10;
      mult = 1;
    }
  }
  return exceedances;
}

/*
 * Autoconfigure a dataset:
 * 1. inspect the dataset, and create facets for the properties
 * 2. for continuous facets, guess the missing values, and set the minimum and maximum values
 * 3. for categorial facets, set the categories
 *
 * @memberof Dataset
 * @param {Dataset} dataset
 */
function scanData (dataset) {
  function addfacet (path, value) {
    var type = 'categorial';

    // TODO: auto identify more types
    // types: ['continuous', 'categorial', 'time']
    if (value === +value) {
      type = 'continuous';
    }

    var f = dataset.facets.add({
      name: path,
      accessor: path,
      type: type,
      description: 'Automatically detected facet, please check configuration'
    });

    if (type === 'categorial') {
      f.setCategories();
    } else if (type === 'continuous') {
      f.setMinMaxMissing();
    }
  }

  function recurse (path, tree) {
    var props = Object.getOwnPropertyNames(tree);

    props.forEach(function (name) {
      var subpath;
      if (path) subpath = path + '.' + name; else subpath = name;

      // add an array as categorial facet, ie. labelset, to prevent adding each element as separate facet
      // also add the array length as facet
      if (tree[name] instanceof Array) {
        addfacet(subpath, tree[name]);
        addfacet(subpath + '.length', tree[name].length);
      // recurse into objects
      } else if (tree[name] instanceof Object) {
        recurse(subpath, tree[name]);
      // add strings and numbers as facets
      } else {
        addfacet(subpath, tree[name]);
      }
    });
  }

  var dimension = dataset.crossfilter.dimension(function (d) {
    return d;
  });
  var data = dimension.top(11);
  dimension.dispose();

  // TODO we now pick randomly the 10th element, but we should be more smart about that
  recurse('', data[10]);
}

/*
 * initDataFilter
 * Initialize the data filter, and construct the getData callback function on the filter.
 * @memberof Dataset
 * @param {Dataset} filter
 * @param {Filter} filter
 */
function initDataFilter (dataset, filter) {
  var facetA = filter.primary;
  var facetB = filter.secondary;
  var facetC = filter.tertiary;

  if (!facetA) facetA = new Facet({type: 'constant'});
  if (!facetC) facetC = facetB;
  if (!facetC) facetC = facetA;
  if (!facetB) facetB = new Facet({type: 'constant'});

  var valueA = utildx.valueFn(facetA);
  var valueB = utildx.valueFn(facetB);
  var valueC = utildx.valueFn(facetC);

  var groupA = utildx.groupFn(facetA);
  var groupB = utildx.groupFn(facetB);

  filter.dimension = dataset.crossfilter.dimension(function (d) {
    return valueA(d);
  });
  var group = filter.dimension.group(function (a) {
    return groupA(a);
  });

  group.reduce(
    function (p, v) { // add
      var bs = groupB(valueB(v));
      if (!(bs instanceof Array)) {
        bs = [bs];
      }

      var val = valueC(v);
      bs.forEach(function (b) {
        p[b] = p[b] || {count: 0, sum: 0};

        if (val !== misval) {
          p[b].count++;
          val = +val;
          if (val) {
            p[b].sum += val;
          }
        }
      });
      return p;
    },
    function (p, v) { // subtract
      var bs = groupB(valueB(v));
      if (!(bs instanceof Array)) {
        bs = [bs];
      }

      var val = valueC(v);
      bs.forEach(function (b) {
        if (val !== misval) {
          p[b].count--;
          val = +val;
          if (val) {
            p[b].sum -= val;
          }
        }
      });
      return p;
    },
    function () { // initialize
      return {};
    }
  );

  var reduce = utildx.reduceFn(facetC);

  filter.getData = function () {
    var result = [];

    // Get data from crossfilter
    var groups = group.all();

    // Unpack array dims
    groups = utildx.unpackArray(groups);

    // Post process

    // sum groups to calculate relative values
    var fullTotal = 0;
    var groupTotals = {};
    groups.forEach(function (group) {
      Object.keys(group.value).forEach(function (subgroup) {
        var value = reduce(group.value[subgroup]);
        groupTotals[group.key] = groupTotals[group.key] || 0;
        groupTotals[group.key] += value;
        fullTotal += value;
      });
    });

    // re-format the data
    groups.forEach(function (group) {
      Object.keys(group.value).forEach(function (subgroup) {
        // normalize
        var value = reduce(group.value[subgroup]);
        if (facetC.reducePercentage) {
          if (filter.secondary) {
            // we have subgroups, normalize wrt. the subgroup
            value = 100.0 * value / groupTotals[group.key];
          } else {
            // no subgroups, normalize wrt. the full total
            value = 100.0 * value / fullTotal;
          }
        }
        result.push({
          a: group.key,
          b: subgroup,
          c: value
        });
      });
    });
    filter.data = result;
    filter.trigger('newdata');
  };
}

/*
 * relaseDataFilter
 * The opposite or initDataFilter, it should remove the filter and deallocate other configuration
 * related to the filter.
 * @memberof Dataset
 * @param {Dataset} dataset
 * @param {Filter} filter
 */
function releaseDataFilter (dataset, filter) {
  if (filter.dimension) {
    filter.dimension.filterAll();
    filter.dimension.dispose();
    delete filter.dimension;
    delete filter.getData;
  }
}

/*
 * updateDataFilter
 * Change the filter parameters for an initialized filter
 * @memberof Dataset
 * @param {Dataset} dataset
 * @param {Filter} filter
 */
function updateDataFilter (dataset, filter) {
  if (filter.dimension) {
    filter.dimension.filterFunction(filter.filterFunction);
  }
}

module.exports = Dataset.extend({
  initialize: function () {
    this.extendFacets(this, this.facets);
    this.extendFilters(this, this.filters);
  },

  /*
   * Implementation of virtual methods
   */
  scanData: function () {
    scanData(this);
  },
  setMinMaxMissing: setMinMaxMissing,
  setCategories: setCategories,
  getPercentiles: getPercentiles,
  getExceedances: getExceedances,

  initDataFilter: initDataFilter,
  releaseDataFilter: releaseDataFilter,
  updateDataFilter: updateDataFilter,

  /*
   * Crossfilter Object, for generating dimension
   */
  crossfilter: crossfilter
});
