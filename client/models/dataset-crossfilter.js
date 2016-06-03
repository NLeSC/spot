var Collection = require('ampersand-collection');
var CrossfilterFacet = require('./facet-crossfilter');
var util = require('../util');
var utildx = require('../util-crossfilter');
var misval = require('../misval');

// ********************************************************
// Dataset utility functions
// ********************************************************

// Finds the range of a continuous facet, and detect missing data indicators, fi. -9999, and set the facet properties
function getMinMaxMissing (facet) {
  var basevalueFn = facet.baseValue;
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
  var basevalueFn = facet.baseValue;
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

// Draw a sample, and call a function with the sample as argument
function sampleData (count, cb) {
  var dimension = utildx.crossfilter.dimension(function (d) {
    return d;
  });
  var data = dimension.top(count);
  dimension.dispose();

  cb(data);
}

function scanData (dataset) {
  function addfacet (path, value) {
    var type = 'categorial';

    // TODO: auto identify more types
    // types: ['continuous', 'categorial', 'time']
    if (value === +value) {
      type = 'continuous';
    }

    var f = dataset.add({name: path, accessor: path, type: type, description: 'Automatically detected facet, please check configuration'});
    if (type === 'categorial') {
      getCategories(f);
    } else if (type === 'continuous') {
      getMinMaxMissing(f);
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

  sampleData(11, function (data) {
    recurse('', data[10]);
  });
}

// ********************************************************
// Data callback function
// ********************************************************

// General crosfilter function, takes three factes, and returns:
// { data: function () ->
//  [{
//      a: facetA.group(d),
//      b: facetB.group(d),
//      c: reduce( facetC )
//  },...]
//  dimension: crossfilter.dimension()
// }

function initDataFilter (widget) {
  var facetA = widget.primary;
  var facetB = widget.secondary;
  var facetC = widget.tertiary;

  if (!facetA) facetA = util.unitFacet;
  if (!facetC) facetC = facetB;
  if (!facetC) facetC = facetA;
  if (!facetB) facetB = util.unitFacet;

  var valueA = facetA.value;
  var valueB = facetB.value;
  var valueC = facetC.value;

  var groupA = facetA.group;
  var groupB = facetB.group;

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
          if (facetB === util.unitFacet) {
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

  // start retreiving data
  widget.getData();
}

function releaseDataFilter (widget) {
  if (widget.dimension) {
    widget.dimension.filterAll();
    widget.dimension.dispose();
    delete widget.dimension;
  }
}

function setDataFilter (widget) {
  if (widget.dimension) {
    widget.dimension.filterFunction(widget.filterFunction);
  }
}

module.exports = Collection.extend({
  model: CrossfilterFacet,
  comparator: function (left, right) {
    return left.name.localeCompare(right.name);
  },

  initDataFilter: initDataFilter,
  releaseDataFilter: releaseDataFilter,
  setDataFilter: setDataFilter,

  getCategories: getCategories,
  scanData: function () {
    scanData(this);
  }
});
