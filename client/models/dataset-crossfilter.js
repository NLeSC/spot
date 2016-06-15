/**
 * A Dataset is responsible for actually managing the data: based on the widgets and their factes,
 * implement callbacks that return the processed data in a standardized format.
 *
 * To help analyze data, a few methods to help autoconfigure your session must be implemented.
 *
 * Implementations for Crossfilter (fully in memory client side filtering) and PostgreSQL datasets are available.
 * @interface Dataset
 */

// A dataset backed by Crossfilter, ie. fully client side filtering without the need for a server or database.
// @module client/dataset-crossfilter
var Collection = require('ampersand-collection');
var Facet = require('./facet');
var util = require('../util');
var utildx = require('../util-crossfilter');
var misval = require('../misval');

function sortByKey (a, b) {
  if (a.key < b.key) return -1;
  if (a.key > b.key) return 1;
  return 0;
}

/**
 * setMinMaxMissing finds the range of a continuous facet, and detect missing data indicators, fi. -9999
 * Updates the minval, maxval, and misval properties of the facet
 * @memberof! Dataset
 * @param {Facet} facet
 */
function setMinMaxMissing (facet) {
  var basevalueFn = utildx.baseValueFn(facet);
  var dimension = utildx.crossfilter.dimension(basevalueFn);

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

/**
 * setCategories finds finds all values on an ordinal (categorial) axis
 * Updates the categories property of the facet
 *
 * @memberof Dataset
 * @param {Facet} facet
 */
function setCategories (facet) {
  var basevalueFn = utildx.baseValueFn(facet);
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

/**
 * Autoconfigure a dataset:
 * 1. inspect the dataset, and create facets for the properties
 * 2. for continuous facets, guess the missing values, and set the minimum and maximum values
 * 3. for categorial facets, set the categories
 *
 * @memberof Dataset
 * @param {Widget} widget
 */
function scanData () {
  var dataset = this;
  function addfacet (path, value) {
    var type = 'categorial';

    // TODO: auto identify more types
    // types: ['continuous', 'categorial', 'time']
    if (value === +value) {
      type = 'continuous';
    }

    var f = dataset.add({name: path, accessor: path, type: type, description: 'Automatically detected facet, please check configuration'});
    if (type === 'categorial') {
      setCategories(f);
    } else if (type === 'continuous') {
      setMinMaxMissing(f);
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

  var dimension = utildx.crossfilter.dimension(function (d) {
    return d;
  });
  var data = dimension.top(11);
  dimension.dispose();

  // TODO we now pick randomly the 10th element, but we should be more smart about that
  recurse('', data[10]);
}

/**
 * initDataFilter
 * Initialize the data filter, and construct the getData callback function on the widget.
 * @memberof Dataset
 * @param {Widget} widget
 */
function initDataFilter (widget) {
  var facetA = widget.primary;
  var facetB = widget.secondary;
  var facetC = widget.tertiary;

  if (!facetA) facetA = util.unitFacet();
  if (!facetC) facetC = facetB;
  if (!facetC) facetC = facetA;
  if (!facetB) facetB = util.unitFacet();

  var valueA = utildx.valueFn(facetA);
  var valueB = utildx.valueFn(facetB);
  var valueC = utildx.valueFn(facetC);

  var groupA = utildx.groupFn(facetA);
  var groupB = utildx.groupFn(facetB);

  widget.dimension = utildx.crossfilter.dimension(function (d) {
    return valueA(d);
  });
  var group = widget.dimension.group(function (a) {
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

  widget.getData = function () {
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
          if (widget.secondary) {
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
    widget.data = result;
    widget.trigger('newdata');
  };

  // apply current selection
  widget.dimension.filterFunction(widget.selection.filterFunction);
}

/**
 * relaseDataFilter
 * The opposite or initDataFilter, it should remove the filter and deallocate other configuration
 * related to the filter.
 * @memberof Dataset
 * @param {Widget} widget
 */
function releaseDataFilter (widget) {
  if (widget.dimension) {
    widget.dimension.filterAll();
    widget.dimension.dispose();
    delete widget.dimension;
    delete widget.getData;
  }
}

/**
 * updateDataFilter
 * Change the filter parameters for an initialized filter
 * @memberof Dataset
 * @param {Widget} widget
 */
function updateDataFilter (widget) {
  if (widget.dimension) {
    widget.dimension.filterFunction(widget.selection.filterFunction);
  }
}

module.exports = Collection.extend({
  model: Facet,
  comparator: function (left, right) {
    return left.name.localeCompare(right.name);
  },

  initDataFilter: initDataFilter,
  releaseDataFilter: releaseDataFilter,
  updateDataFilter: updateDataFilter,

  setCategories: setCategories,
  setMinMaxMissing: setMinMaxMissing,

  scanData: scanData
});
