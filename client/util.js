var d3 = require('d3');

// dont change! implementation depends on it being sorted to the start of any list of numbers
var misval = -Number.MAX_VALUE;

/** 
 * Filter implementation specific: 
 *
 *   crossfilter objects to be passed directly to a dc chart:
 *   dx_dimension dx.filter()       for chart.dimension()
 *   dx_group     dx.filter.group() contains the group operations; for chart.group()
 *                   mostly group.all()
 */


var wrapSumCountOrAverage = function(facet) {

    var valueAccessor;
    if(facet.reduceSum) {
        return function (d) {
            return d.value.sum;
        };
    }
    else if (facet.reduceCount) {
        return function (d) {
            return d.value.count;
        };
    }
    else if (facet.reduceAverage) {
        return function (d) {
            if(d.value.count > 0) {
                return d.value.sum / d.value.count;
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
    }
    return null;
};


// Usecase: general purpose
//   A continuous or categorial
//   B continuous or false
// Data format:
//    [ {key: facetA.group(d), value: {sum: facetB.value(d)., count: sum 1}, ....]
var dxGlue1d = function (facetA,facetB) {
    var valueFn;
    if(facetB) {
        valueFn = facetB.value;
    }
    else  {
        valueFn = facetA.value;
    }

    var dimension = window.app.crossfilter.dimension(facetA.value);
    var group = dimension.group(facetA.group); 

    group.reduce(
        function (p,v) { // add
            var value = valueFn(v);
            if(value != misval) {
                p.sum += value;
                p.count++;
            }
            return p;
        },
        function (p,v) { // subtract
            var value = valueFn(v);
            if(value != misval) {
                p.sum -= value;
                p.count--;
            }
            return p;
        },
        function () { // initialize
            return {count: 0, sum: 0};
        }
    );

    var valueAccessor;
    var wrapped_group;
    if(facetB) {
        valueAccessor = wrapSumCountOrAverage(facetB);
        wrapped_group = wrapAbsoluteOrRelative(group, facetB);
    }
    else {
        valueAccessor = wrapSumCountOrAverage(facetA);
        wrapped_group = wrapAbsoluteOrRelative(group, facetA);
    }

    return {
        dimension: dimension,
        group: wrapped_group,
        valueAccessor: valueAccessor,
    }; 
};

// Usecase: boxplot
// FIXME: currently, boxplots are slow
//  A continuous or categorial
//  B continuous (categorial untested, will probably crash dcjs)
// Dataformat:
//  [ {key: facetA.group(d), value: [ d0, d1, d2, d3, ... ] }, ... ]
var dxGlueAwithBs = function (facetA,facetB) {
    var dimension = window.app.crossfilter.dimension(facetA.value);
    var group = dimension.group(facetA.group);

    var valueFn = facetB.value;

    group.reduce(
        function(p,v) {
            var value = valueFn(v); 
            if(value!=misval) {
                p.push(valueFn(v));
            }
            return p;
        },
        function(p,v) {
            var value = valueFn(v); 
            if(value!=misval) {
                p.splice(p.indexOf(valueFn(v)), 1);
            }
            return p;
        },
        function() {
            return [];
        }
    );

    return {
        dimension: dimension,
        group: group,
    }; 
};


// Usecase: scatterplot correlationplot
//  A continuous or categorial         (x-axis)
//  B continuous or categorial         (y-axis)
//  C continuous [default f(d)=1]      (z-axis)
// Dataformat:
//   [ {key: [ facetA.group(d), facetB.group(d) ], value: {count: sum 1, sum: .., xsum:., ysum:., xysum:., yysum:. } }, ... ]
var dxGlue2d = function (facetA, facetB, facetC) {

    var valueA = facetA.value;
    var valueB = facetB.value;

    var valueC;
    if(facetC) {
        valueC = facetC.value;
    }
    else {
        valueC = function () {return 1;};
    }

    var dimension = window.app.crossfilter.dimension(function(d) {return [valueA(d), valueB(d)];});

    // Setup grouping
    var xgroupFn = facetA.group;
    var ygroupFn = facetB.group;
    var group = dimension.group(function(d) {
        var x = d[0];
        var y = d[1];
        if(x != misval) {
            x = xgroupFn(x);
        }
        if(y != misval) {
            y = ygroupFn(y);
        }
        return [x,y];
    }); 

    group.reduce(
        function (p,v) { // add
            var x = valueA(v);
            var y = valueB(v);
            var z = valueC(v);
            if(x != misval && y != misval && z != misval) {
                p.count++;
                p.sum += z;
                p.xsum += x;
                p.ysum += y;
                p.xysum += x * y;
                p.xxsum += x * x;
                p.yysum += y * y;
            }
            return p;
        }, 
        function (p,v) { // subtract 
            var x = valueA(v);
            var y = valueB(v);
            var z = valueC(v);
            if(x != misval && y != misval && z != misval) {
                p.count--;
                p.sum -= z;
                p.xsum -= x;
                p.ysum -= y;
                p.xysum -= x * y;
                p.xxsum -= x * x;
                p.yysum -= y * y;
            }
            return p;
        },
        function () { // initialize
            return {
                count: 0,
                sum: 0,
                xsum: 0,
                ysum: 0,
                xysum: 0,
                xxsum: 0,
                yysum: 0,
            }; 
        });

    var valueAccessor;
    if(facetC) {
        valueAccessor = wrapSumCountOrAverage(facetC);
    }
    else {
        valueAccessor = wrapSumCountOrAverage(facetB);
    }

    var wrapped_group = wrapAbsoluteOrRelative(group, facetB);

    return {
        dimension: dimension,
        group: wrapped_group,
        valueAccessor: valueAccessor
    }; 
};

// Usecase: stacked barchart
//   A: continuous or categorial          (x-axis)
//   B: categorial: [ C1, C2, C3, ...]    (y-axis)
//   C: continuous [default: f(d)=1]      (z-axis)
// Dataformat:
//  [ {key: facetA.group(d), value: {C1: sum(facetC.value(d)), C2: sum(facetC.value(d)), ..., _total: sum 1}, ...]
var dxGlueAbyCatB = function (facetA, facetB, facetC) {
    var dimension = window.app.crossfilter.dimension(facetA.value);
    var group = dimension.group(facetA.group);
   
    var valueB = facetB.value;
    var domain = facetB.x.domain();

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
                p[y] += z;
                p._total += z;
            }
            return p;
        },
        function (p,v) { // subtract
            var y = valueB(v);
            var z = valueC(v);
            if(y != misval && z != misval) {
                p[y] -= z;
                p._total -= z;
            }
            return p;
        },
        function () { // initialize
            var result = {_total: 0};
            domain.forEach(function (f) {
                result[f] = 0;
            });
            return result;
        });

    return {
        dimension: dimension,
        group: group
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
    dxGlue1d: dxGlue1d,
    dxGlue2d: dxGlue2d,
    dxDataGet: dxDataGet,
    dxGetCategories: dxGetCategories,
    dxGetPercentiles: dxGetPercentiles,
    dxGetExceedances: dxGetExceedances,
    dxGlueAbyCatB: dxGlueAbyCatB,
    dxGlueAwithBs: dxGlueAwithBs,
    misval: misval,
};
