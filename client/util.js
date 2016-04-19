var d3 = require('d3');

// dont change! implementation depends on it being sorted to the start of any list of numbers
var misval = -Number.MAX_VALUE;

/** 
 * Filter implementation specific: 
 *
 *   data:           function returning provides grouped data for plotting
 *   dimension:      crossfilter.dimension() providing filter() method
 */

var scanData = function () {
    var Facet = require('./models/facet');
    var dimension = window.app.crossfilter.dimension(function (d){return d;});

    var data = dimension.top(1);
    var props = Object.getOwnPropertyNames(data[0]);

    // FIXME: nested properties
    props.forEach(function(name) {
        var type;
        var value = data[0][name];
        var facet;

        // FIXME: auto identify more types
        // types: ['continuous', 'categorial', 'spatial', 'time', 'network']
        if ( value == +value ) {
            type = 'continuous';
        }
        type = 'categorial';
        f = new Facet({name: name, accessor: name, type: type, description:'Automatically detected facet, please configure'});

        if (type == 'categorial') {
            f.categories.reset(dxGetCategories(f));
        }

        window.app.me.facets.add(f);
    });
};

var filter1dCategorialHandler = function (filters, filter, categories) {
 
    // A) none selected:
    //   -> add
    // B) one selected: 
    //   a) same one clicked:
    //   -> invert selection
    //   b) different one clicked:
    //   -> add
    // C) more selected:
    //   a) same one clicked:
    //   -> remove
    //   b) different one clicked:
    //   -> add

    // after add: if filters == categories, reset and dont filter
    var i = filters.indexOf(filter); 

    if(filters.length != 1) {
        if(i > -1) {
            filters.splice(i,1);
            return;
        }
    }
    else {
        if(i > -1) {
            filters.splice(0,filters.length);
            categories.forEach(function (f) {
                if (f.group!=filter) {
                    filters.push(f.group);
                }
            });
            return;
        }
    }
    // Add
    filters.push(filter);

    // allow all => filter none
    if(filters.length === categories.length) {
        filters.splice(0,filters.length);
    }
};

var filter1dContinuousHandler = function (filters, filter, domain) {
    if (filters.length == 0) {
        filters[0] = filter;
        filters[1] = domain[1];
    }
    else if (filters[1] == domain[1]) {
        filters[1] = filter;
    }
    else {
        var d1 = Math.abs(filters[0] - filter);
        var d2 = Math.abs(filters[1] - filter);
        if (d1 < d2) {
            filters[0] = filter;
        }
        else {
            filters[1] = filter;
        }
    }
};

var filter1dCategorial = function (widget) {
    var dimension = widget._crossfilter.dimension;

    dimension.filter(null);

    // Set of selected values
    var selection = widget.selection;

    if (selection.length == 0) {
        widget._crossfilter.filterFunction = function (d) {
            return true;
        };
    }
    else {
        widget._crossfilter.filterFunction = function (d) {
            var i;
            for (i=0; i < selection.length; i++) {
                if (selection[i] == d) {
                    return true;
                }
            }
            return false;
        };
        dimension.filterFunction(widget._crossfilter.filterFunction);
    }
};

// return true if domain[0] <= d <= domain[1]
var filter1dContinuous = function (widget) {
    var dimension = widget._crossfilter.dimension;

    dimension.filter(null);

    var min = widget.selection[0];
    var max = widget.selection[1];

    // dont filter when the filter is incomplete / malformed
    if (min == misval || max == misval || min == max) {
        widget._crossfilter.filterFunction = function (d) {
            return true;
        };
        return;
    }

    if(min > max) {
        var swap = min;
        min = max;
        max = swap;
    }

    widget._crossfilter.filterFunction = function (d) {
        return (d >= min && d <= max && d != misval);
    };

    dimension.filterFunction(widget._crossfilter.filterFunction);
};

var isSelected = function(widget, d) {
    if(widget && widget._crossfilter && widget._crossfilter.filterFunction) {
        return widget._crossfilter.filterFunction(d);
    }
    return true;
};

var wrapSumCountOrAverage = function(facet) {

    var valueAccessor;
    if(facet.reduceSum) {
        return function (d) {
            return d.sum;
        };
    }
    else if(facet.reduceCount) {
        return function (d) {
            return d.count;
        };
    }
    else if(facet.reduceAverage) {
        return function (d) {
            if(d.count > 0) {
                return d.sum / d.count;
            }
            else {
                return 0.0;
            }
        };
    }
    else {
        console.log("Reduction not implemented for this facet", facet);
    }
    return null;
};

var wrapAbsoluteOrRelative = function(group, facet) {
    if(facet.reducePercentage) {
        return {
            all: function () {
                var records = group.all();

                // Create a copy, as we shouldnt modify the crossfilters groups
                var scaled_records = [];

                var fullsum = 0, fullcount = 0;
                records.forEach(function(f) {
                    fullsum += f.value.sum;
                    fullcount += f.value.count;
                    scaled_records.push(f);
                });

                records.forEach(function(f) {
                    f.value.count = f.value.count / fullcount;
                    f.value.sum = f.value.count / fullsum;
                });
                return scaled_records;
            },
        };
    }
    else if (facet.reduceAbsolute) {
        return group;
    }
    else {
        console.log("Reduction not implemented for facet", facet);
        return null;
    }
};



// Usecase: stacked barchart
//   A: continuous or categorial          (x-axis)
//   B: categorial: [ C1, C2, C3, ...]    (y-axis)
//   C: continuous [default: f(d)=1]      (z-axis)
// Dataformat:
//  [{
//      key: facetA.group(d),
//      value: {
//         facetB.value(d): {
//            count: sum 1,
//            sum: sum(facetC.value(d)),
//         },
//         ...
//      }
//  }, ...]
var dxGlueAbyCatB = function (facetA, facetB, facetC) {
    var dimension = window.app.crossfilter.dimension(facetA.value);
    var group = dimension.group(facetA.group);
  
    var valueB;
    var domain;
    if (facetB) {
        valueB = facetB.value;
        domain = facetB.group.domain();
    }
    else {
        valueB = function () {return 1;};
        domain = [1];
    } 

    var valueC;
    if(facetC) {
        valueC = facetC.value;
    }
    else {
        valueC = function () {return 1;};
    }

    group.reduce(
        function (p,v) { // add
            var y = valueB(v);
            var z = valueC(v);
            if(y != misval && z != misval) {
                p[y].count++;
                p[y].sum += z;
            }
            return p;
        },
        function (p,v) { // subtract
            var y = valueB(v);
            var z = valueC(v);
            if(y != misval && z != misval) {
                p[y].count--;
                p[y].sum -= z;
            }
            return p;
        },
        function () { // initialize
            var p = {};
            domain.forEach(function (y) {
                p[y] = {
                    count: 0,
                    sum: 0
                };
            });
            return p;
        }
    );

    var valueAccessor;
    if (facetC) {
        valueAccessor = wrapSumCountOrAverage(facetC);
    }
    else if (facetB) {
        valueAccessor = wrapSumCountOrAverage(facetB);
    }
    else {
        valueAccessor = wrapSumCountOrAverage(facetA);
    }

    var data = function () {
        var result = [];
 
        // Get data from crossfilter
        var groups = group.all();

        // Post process
        // FIXME: absolute or relative
        groups.forEach(function (g,i) {
            result[i] = {
                key: g.key,
                values: {},
            };

            Object.keys(g.value).forEach(function (v) {
                result[i].values[v] = valueAccessor(g.value[v]);
            });
        });

        return result;
    };

    return {
        data: data,
        dimension: dimension,
    };
};


// Usecase: find all values on an ordinal (categorial) axis
// returns Array [ {key: .., value: ...}, ... ]
// NOTE: numbers are parsed: so not {key:'5', 20} but {key:5, value: 20}
var dxGetCategories = function (facet) {

    var rawValue = function (d) {
        var val = facet.basevalue(d);

        // User should only see user-defined missing data values
        if (val == misval) {
            return facet.misval[0];
        }
        return val;
    };

    var dimension = window.app.crossfilter.dimension(rawValue);
    var group = dimension.group().reduceCount();

    function compare(a,b) {
        if (a.key < b.key) return -1;
        if (a.key > b.key) return 1;
        return 0;
    }

    var data = group.top(Infinity).sort(compare);
    dimension.dispose();

    return data;
};

// Usecase: transformPercentiles
// Calculate 100 percentiles (ie. 1,2,3,4 etc.)
// approximate the nth percentile by taking the data at index:
//     i ~= floor(0.01 * n * len(data))
var dxGetPercentiles = function (facet) {
    var basevalueFn = facet.basevalue;
    var dimension = window.app.crossfilter.dimension(basevalueFn);
    var data = dimension.bottom(Infinity);

    var percentiles = [];
    var p, i, value;

    // drop missing values, which should be sorted at the start of the array
    i=0;
    while(basevalueFn(data[i]) == misval) i++;
    data.splice(0,i);

    for(p=0; p<101; p++) {
        i = Math.trunc(p * 0.01 * (data.length-1));
        value = basevalueFn(data[i]);
        percentiles.push({x: value, p:p});
    }

    dimension.dispose();

    return percentiles;
};

// Usecase: transformExceedances
// Calculate value where exceedance probability is one in 10,20,30,40,50,
// and the same for -exceedance -50, -60, -70, -80, -90, -99, -99.9, -99.99, ... percent
// Approximate from data: 1 in 10 is larger than value at index trunc(0.1 * len(data))
var dxGetExceedances = function (facet) {
    var basevalueFn = facet.basevalue;
    var dimension = window.app.crossfilter.dimension(basevalueFn);
    var data = dimension.bottom(Infinity);
    var exceedance;
    var i, value, oom, mult, n;

    // drop missing values, which should be sorted at the start of the array
    i=0;
    while(basevalueFn(data[i]) == misval) i++;
    data.splice(0,i);

    // percentilel
    // P(p)=x := p% of the data is smaller than x, (100-p)% is larger than x
    //  
    // exceedance:
    // '1 in n' value, or what is the value x such that the probabiltiy drawing a value y with y > x is 1 / n

    exceedance = [{x: basevalueFn(data[ data.length / 2]), e: 2}];

    // order of magnitude
    oom = 1;
    mult = 3;
    while( mult * oom < data.length ) {

        n = oom * mult;

        // exceedance
        i = data.length - Math.trunc(data.length/n);
        value = basevalueFn(data[i]);

        // only add it if it is different form the previous value
        if( value > exceedance[ exceedance.length - 1].x ) {
            exceedance.push({x: value, e:n});
        }

        // subceedance (?)
        i = data.length - i;
        value = basevalueFn(data[i]);

        // only add it if it is different form the previous value
        if( value < exceedance[0].x ) {
            exceedance.unshift({x: value, e: -n});
        }

        mult++;
        if(mult==10) {
            oom = oom * 10;
            mult=1;
        }
    }
    dimension.dispose();
    return exceedance;
};


// FIXME: creating and disposing dimension is slow.. maybe keep it around somewhere..
//        this is used in the heatmap, should be refactored when adding/joining data is implemented
var dxDataGet = function () {
    var dimension = window.app.crossfilter.dimension(function (d) {return 1;});
    var data = dimension.top(Infinity);
    dimension.dispose();
    return data;
};

module.exports = {
    dxDataGet: dxDataGet,
    dxGetCategories: dxGetCategories,
    dxGetPercentiles: dxGetPercentiles,
    dxGetExceedances: dxGetExceedances,
    dxGlueAbyCatB: dxGlueAbyCatB,
    misval: misval,

    filter1dCategorial: filter1dCategorial,
    filter1dContinuous: filter1dContinuous,
    filter1dCategorialHandler: filter1dCategorialHandler,
    filter1dContinuousHandler: filter1dContinuousHandler,
    isSelected: isSelected,

    scanData: scanData,
};
