/**
 * Implementation of a dataset backed by Crossfilter, ie. fully client side filtering without the need for a server or database.
 * Due to limitation of crossfilter with array (or data that has no natrual ordering), this will not work as expected:
 * * dimension: `function (d) {return [d.x, d.y, d.z]}`
 * * group: `function (d) {return [d.x / 10 , d.y / 10, d.z / 10]}`
 *
 * Therfore, we preform grouping already in the dimension itself, and join the array to a string.
 * Strings have a natural ordering and thus can be used as dimension value.
 * * dimension: `function (d) -> "d.x/10|d.y/10|d.z/10"`
 * * group: `function (d) {return d;}`
 * @module client/dataset-client
 */
var moment = require('moment-timezone');
var Crossfilter = require('crossfilter2');
var Dataset = require('../dataset');

var utildx = require('../util/crossfilter');
var misval = require('../util/misval');

var grpIdxToName = {0: 'a', 1: 'b', 2: 'c', 3: 'd', 4: 'e'};
var aggRankToName = {1: 'aa', 2: 'bb', 3: 'cc', 4: 'dd', 5: 'ee'};

/**
 * setMinMax sets the range of a continuous or time facet
 * @param {Facet} facet
 */
function setMinMax (facet) {
  // we need the value just before a transformation, so baseValueFn
  var valFn = utildx.baseValueFn(facet);

  // to be able to mark the value as missing we need it unprocessed, so rawValueFn
  var rawValFn = utildx.rawValueFn(facet);

  var group = this.crossfilter.groupAll();

  var lessFn;
  var moreFn;
  if (facet.isDatetime) {
    lessFn = function (a, b) { return (b === misval || a.isBefore(b)); };
    moreFn = function (a, b) { return (b === misval || b.isBefore(a)); };
  } else {
    lessFn = function (a, b) { return (b === misval || a < b); };
    moreFn = function (a, b) { return (b === misval || a > b); };
  }

  group.reduce(
    // add
    function (p, d) {
      var rawV = rawValFn(d);
      var v = valFn(d);
      if (v === misval) {
        return p;
      }
      if (lessFn(v, p.min)) {
        p.min = v;
        p.rawMin = rawV;
      }
      if (moreFn(v, p.max)) {
        p.max = v;
        p.rawMax = rawV;
      }
      return p;
    },
    // subtract
    function (p, v) {
      return p;
    },
    // initialize
    function () {
      return {
        min: misval,
        max: misval,
        rawMin: misval,
        rawMax: misval
      };
    }
  );
  var value = group.value();
  if (value.min !== misval) {
    if (facet.isContinuous) {
      facet.minvalAsText = value.min.toString();
    } else if (facet.isDatetime) {
      facet.minvalAsText = value.min.toISOString();
    } else if (facet.isDuration) {
      facet.minvalAsText = value.min.toISOString();
    }
    facet.rawMinval = value.rawMin;
  } else {
    facet.minvalAsText = '';
    facet.rawMinval = misval;
  }

  if (value.max !== misval) {
    if (facet.isContinuous) {
      facet.maxvalAsText = value.max.toString();
    } else if (facet.isDatetime) {
      facet.maxvalAsText = value.max.toISOString();
    } else if (facet.isDuration) {
      facet.maxvalAsText = value.max.toISOString();
    }
    facet.rawMaxval = value.rawMax;
  } else {
    facet.maxvalAsText = '';
    facet.rawMaxval = misval;
  }
  group.dispose();
}

/**
 * sampleDataset returns an array containing N random datums from the dataset
 * @param {Dataset} dataset
 * @param {intger} N Number of elements to pick
 * @returns {Object[]} Array N data Objects
 */
function sampleDataset (dataset, N) {
  var wantedElements = [];

  var i;
  for (i = 0; i < N; i++) {
    wantedElements[i] = Math.round(Math.random() * dataset.crossfilter.size());
  }

  var group = dataset.crossfilter.groupAll();
  group.reduce(
    // add
    function (p, d) {
      var i = wantedElements.indexOf(p.element);
      if (i > -1) {
        p.data[i] = d;
      }
      p.element++;
      return p;
    },
    // subtract
    function (p, v) {
      return p;
    },
    // initialize
    function () {
      return {
        element: 0,
        data: []
      };
    }
  );

  var data = group.value().data;
  group.dispose();

  return data;
}

/**
 * setCategories finds finds all values on an ordinal (categorial) axis
 * Updates the categorialTransform of the facet
 *
 * @param {Facet} facet
 */
function setCategories (facet) {
  // we need the value just before a transformation, so baseValueFn
  var valFn = utildx.baseValueFn(facet);

  var group = this.crossfilter.groupAll();
  group.reduce(
    // add
    function (p, v) {
      var vals = valFn(v);
      if (vals instanceof Array) {
        vals.forEach(function (val) {
          if (p.hasOwnProperty(val)) {
            p[val]++;
          } else {
            p[val] = 1;
          }
        });
      } else {
        if (p.hasOwnProperty(vals)) {
          p[vals]++;
        } else {
          p[vals] = 1;
        }
      }
      return p;
    },
    // subtract
    function (p, v) {
      var vals = valFn(v);
      if (vals instanceof Array) {
        vals.forEach(function (val) {
          p[val]--;
        });
      } else {
        p[vals]--;
      }
      return p;
    },
    // initialize
    function () {
      return {};
    }
  );

  facet.categorialTransform.reset();

  var data = group.value();
  Object.keys(data).forEach(function (key) {
    // TODO: missing data should be mapped to a misval from misvalAsText
    var keyAsString = key.toString();
    var groupAsString = keyAsString;

    facet.categorialTransform.rules.add({expression: keyAsString, count: data[key], group: groupAsString});
  });
}

/**
 * Calculate 100 percentiles (ie. 1,2,3,4 etc.), and initialize the `facet.continuousTransform`
 * to an approximate percentile mapping.
 * Use the recommended method from [NIST](http://www.itl.nist.gov/div898/handbook/prc/section2/prc262.htm)
 * See also the discussion on [Wikipedia](https://en.wikipedia.org/wiki/Percentile)
 * @param {Facet} facet
 */
function setPercentiles (facet) {
  // we need the value just before a transformation, so baseValueFn
  var basevalueFn = utildx.baseValueFn(facet);
  var dimension = this.crossfilter.dimension(basevalueFn);
  var data = dimension.bottom(Infinity);
  dimension.dispose();

  var tf = facet.continuousTransform;
  var x, i;

  // drop missing values, which should be sorted at the start of the array
  i = 0;
  while (basevalueFn(data[i]) === misval) {
    i++;
  }
  data.splice(0, i);

  // start clean
  tf.reset();

  // add minimum value as control points p0 and p1
  tf.cps.add({x: basevalueFn(data[0]), fx: 0});
  tf.cps.add({x: basevalueFn(data[0]), fx: 0});

  var p, value;
  for (p = 1; p < 100; p++) {
    x = (p * 0.01) * (data.length + 1) - 1; // indexing starts at zero, not at one
    i = Math.trunc(x);
    value = (1 - x + i) * basevalueFn(data[i]) + (x - i) * basevalueFn(data[i + 1]);
    tf.cps.add({x: value, fx: p});
  }

  // add maximum value as p101 and p102
  tf.cps.add({x: basevalueFn(data[data.length - 1]), fx: 100});
  tf.cps.add({x: basevalueFn(data[data.length - 1]), fx: 100});

  tf.type = 'percentiles';
}

/**
 * Autoconfigure a dataset:
 * 1. pick 10 random elements
 * 2. create facets for their properties
 * 3. add facets' values over the sample to the facet.description
 *
 * @param {Dataset} dataset
 */
function scanData () {
  var dataset = this; // to make things clearer

  function facetExists (facets, path) {
    var exists = false;
    facets.forEach(function (f) {
      if (f.accessor === path || f.accessor === path + '[]') {
        exists = true;
      }
    });
    return exists;
  }

  function addValue (values, v, missing) {
    if (v === misval) {
      v = missing;
    }
    if (values.indexOf(v) === -1) {
      values.push(v);
    }
  }

  function guessType (values) {
    var mytype = {
      continuous: 0,
      text: 0,
      datetime: 0,
      duration: 0,
      categorial: 0
    };
    values.forEach(function (value) {
      if (moment(value, moment.ISO_8601).isValid()) {
        // "2016-08-17 17:25:00+01"
        mytype.datetime++;
      } else if (
          (moment.duration(value).asMilliseconds() !== 0) &&
          (typeof value === 'string') &&
          (value[0].toLowerCase() === 'p')) {
        // "P10Y"
        mytype.duration++;
      } else if (value == +value) {  // eslint-disable-line eqeqeq
        // "10" or 10
        mytype.continuous++;
      } else {
        // "hello world"
        mytype.categorial++;
      }
    });

    // get facetType with highest count
    var max = -1;
    var facetType;
    Object.keys(mytype).forEach(function (key) {
      if (mytype[key] > max) {
        facetType = key;
        max = mytype[key];
      }
    });

    return facetType;
  }

  function tryFacet (facets, data, path, value) {
    // Check for existence
    if (facetExists(facets, path)) {
      return;
    }

    // Create a new facet
    var facet = facets.add({
      name: path,
      accessor: path,
      type: 'text'
    });

    // Sample values
    var baseValueFn = utildx.baseValueFn(facet);
    var values = [];
    var isArray = false;

    data.forEach(function (d) {
      var value = baseValueFn(d);
      if (value instanceof Array) {
        isArray = true;
        value.forEach(function (v) {
          addValue(values, v, facet.misval[0]);
        });
      } else {
        addValue(values, value, facet.misval[0]);
      }
    });

    // Reconfigure facet
    facet.accessor = isArray ? facet.accessor + '[]' : facet.accessor;
    facet.type = guessType(values);
    facet.description = values.join(', ').match('^.{0,40}') + '...';
  }

  function recurse (facets, data, path, tree) {
    var props = Object.getOwnPropertyNames(tree);
    props.forEach(function (name) {
      var subpath;
      if (path) {
        subpath = path + '##' + name;
      } else {
        subpath = name;
      }

      if (tree[name] instanceof Array) {
        // add an array as a itself as a facet, ie. labelset, to prevent adding each element as separate facet
        // also add the array length as facet
        tryFacet(facets, data, subpath, tree[name]);
        tryFacet(facets, data, subpath + '.length', tree[name].length);
      } else if (tree[name] instanceof Object) {
        // recurse into objects
        recurse(facets, data, subpath, tree[name]);
      } else {
        // add strings and numbers as facets
        tryFacet(facets, data, subpath, tree[name]);
      }
    });
  }

  // Add facets
  var data = sampleDataset(dataset, 10);
  data.forEach(function (d) {
    recurse(dataset.facets, data, '', d);
  });
}

/**
 * Initialize the data filter, and construct the getData callback function on the filter.
 * @param {Filter} filter
 */
function initDataFilter (filter) {
  var dataset = this; // to prevent confusion with the this variable
  var facet;

  // use the partitions as groups:
  var groupFns = [];
  filter.partitions.forEach(function (partition) {
    facet = dataset.facets.get(partition.facetName, 'name');
    var valueFn = utildx.valueFn(facet);
    var groupFn = utildx.groupFn(partition);

    var rank = partition.rank;
    groupFns[rank - 1] = function (d) {
      return groupFn(valueFn(d));
    };
  });

  // and then create keys from the group values
  var groupsKeys = function (d) {
    var keys = [];

    groupFns.forEach(function (groupFn) {
      var result = groupFn(d);
      var newKeys = [];
      if (keys.length === 0) {
        if (result instanceof Array) {
          newKeys = result;
        } else {
          newKeys = [result];
        }
      } else {
        if (result instanceof Array) {
          keys.forEach(function (oldKey) {
            result.forEach(function (key) {
              newKeys.push(oldKey + '|' + key);
            });
          });
        } else {
          keys.forEach(function (oldKey) {
            newKeys.push(oldKey + '|' + result);
          });
        }
      }
      keys = newKeys;
    });
    return keys;
  };

  // set up the facet valueFns to aggregate over
  // and the reduction functions for them
  var aggregateFns = [];
  var aggregateRanks = [];
  var reduceFns = [];
  if (filter.aggregates.length === 0) {
    // fall back to just counting item
    aggregateFns[0] = function (d) { return 1; };
    aggregateRanks[0] = 1;
    reduceFns[0] = function (d) {
      if (d === misval || d == null) {
        return misval;
      }
      return d.count > 0 ? d.count : misval;
    };
  } else {
    filter.aggregates.forEach(function (aggregate) {
      facet = dataset.facets.get(aggregate.facetName, 'name');
      aggregateRanks.push(aggregate.rank);
      aggregateFns.push(utildx.valueFn(facet));
      reduceFns.push(utildx.reduceFn(aggregate));
    });
  }

  // setup the crossfilter dimensions and groups
  filter.dimension = dataset.crossfilter.dimension(function (d) {
    return groupsKeys(d);
  }, true);
  var group = filter.dimension.group(function (d) { return d; });

  group.reduce(
    // add
    function (p, d) {
      aggregateFns.forEach(function (aggregateFn, i) {
        var val = aggregateFn(d);
        if (val !== misval) {
          val = parseFloat(val);
          p[i] = p[i] || {count: 0, sum: 0, sumsquares: 0};
          p[i].count += 1;
          p[i].sum += val;
          p[i].sumsquares += val * val;
        }
      });
      return p;
    },
    // subtract
    function (p, d) {
      aggregateFns.forEach(function (aggregateFn, i) {
        var val = aggregateFn(d);
        if (val !== misval) {
          val = parseFloat(val);
          p[i] = p[i] || {count: 0, sum: 0, sumsquares: 0};
          p[i].count -= 1;
          p[i].sum -= val;
          p[i].sumsquares -= val * val;
        }
      });
      return p;
    },
    // initialize
    function () {
      return [];
    }
  );

  filter.getData = function () {
    filter.data = [];

    // Get data from crossfilter
    var groups = group.all();

    // { key: "group1|group2|...",
    //   value: [ {count: agg1, sum: agg1}
    //            {count: agg2, sum: agg2}
    //            {count: agg3, sum: agg3}
    //                    ...             ]}
    groups.forEach(function (group) {
      var item = {};

      // turn the string back into individual group values
      var groupsKeys;
      if (typeof group.key === 'string') {
        groupsKeys = group.key.split('|');
      } else {
        // shortcut for numeric non-partitioned case
        groupsKeys = [group.key];
      }

      // add paritioning data to the item
      groupsKeys.forEach(function (subkey, i) {
        item[grpIdxToName[i]] = subkey;
      });

      // add aggregated data to the item
      reduceFns.forEach(function (reduceFn, i) {
        var name = aggRankToName[aggregateRanks[i]];
        item[name] = reduceFn(group.value[i]);
      });

      // add an overall count
      // becuase the filtering removes missing data points, this is the same as
      // the count for any one of the aggregates
      item.count = group.value[0] ? group.value[0].count : 0;

      filter.data.push(item);
    });

    // update counts
    dataset.dataTotal = dataset.crossfilter.size();
    dataset.dataSelected = dataset.countGroup.value();
  };
}

/**
 * The opposite or initDataFilter, it should remove the filter and deallocate other configuration
 * related to the filter.
 * @param {Filter} filter
 */
function releaseDataFilter (filter) {
  if (filter.dimension) {
    filter.dimension.filterAll();
    filter.dimension.dispose();
    delete filter.dimension;
    delete filter.getData;
  }
}

/**
 * Change the filter parameters for an initialized filter
 * @param {Filter} filter
 */
function updateDataFilter (filter) {
  if (filter.dimension) {
    filter.dimension.filterFunction(filter.filterFunction());
  }
}

function getAllData () {
  if (this.isPaused) {
    return;
  }
  this.filters.forEach(function (filter, i) {
    if (filter.isInitialized) {
      filter.getData();
      filter.trigger('newData');
    }
  });
}

module.exports = Dataset.extend({
  props: {
    datasetType: {
      type: 'string',
      setOnce: true,
      default: 'client'
    }
  },
  initialize: function () {
    // first do parent class initialization
    Dataset.prototype.initialize.apply(this, arguments);

    /**
     * Crossfilter instance, see [here](http://square.github.io/crossfilter/)
     */
    this.crossfilter = new Crossfilter([]);
    this.countGroup = this.crossfilter.groupAll().reduceCount();
  },
  /*
   * Implementation of virtual methods
   */
  scanData: scanData,
  setMinMax: setMinMax,
  setCategories: setCategories,
  setPercentiles: setPercentiles,
  initDataFilter: initDataFilter,
  releaseDataFilter: releaseDataFilter,
  updateDataFilter: updateDataFilter,
  getAllData: getAllData
});
