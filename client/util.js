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

// Usecase: general purpose
//   A continuous or categorial
//   B continuous or false
// Data format:
//    [ {key: facetA.group(d), value: {sum: facetB.value(d)., count: sum 1}, ....]
var dxGlue1 = function (facetA,facetB) {
    if(! facetB) {
        facetB = facetA;
    }

    var dimension = window.app.crossfilter.dimension(facetA.value);
    var group = dimension.group(facetA.group); 
    var valueFn = facetB.value;

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

    var wrapped_group;
    if(facetB.reducePercentage) {
        wrapped_group = {
            all: function () {
                var records = group.all();
                var scaled_records = [];

                var fullsum = 0, fullcount = 0;
                records.forEach(function(f) {
                    fullsum += f.value.sum;
                    fullcount += f.value.count;
                });

                records.forEach(function(f) {
                    var newvalue = {
                        count: 100.0 * f.value.count / fullcount,
                        sum: 100.0 * f.value.sum / fullsum
                    };
                    scaled_records.push( {key: f.key, value: newvalue} );
                });
                return scaled_records;
            },
        };
    }
    else if (facetB.reduceAbsolute) {
        wrapped_group = group;
    }
    else {
        console.log( "Reduction not implemented for facet", facetB );
    }
         
    var valueAccessor;
    if(facetB.reduceSum) {
        valueAccessor = function (d) {
            return d.value.sum;
        };
    }
    else if (facetB.reduceCount) {
        valueAccessor = function (d) {
            return d.value.count;
        };
    }
    else if (facetB.reduceAverage) {
        valueAccessor = function (d) {
            if(d.value.count > 0) {
                return d.value.sum / d.value.count;
            }
            else {
                return 0.0;
            }
        };
    }
    else {
        console.log("Reduction not implemented for this grouping", facetB);
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


// Usecase: scatterplot
//  A
//  B
// Dataformat:
//   [ {key: [ facetA.group(d), facetB.group(d) ], value: sum 1}, ... ]
// FIXME: implement facetC for value
var dxGlue2d = function (facetA, facetB) {

    var xvalFn = facetA.value;
    var yvalFn = facetB.value;
    var dimension = window.app.crossfilter.dimension(function(d) {return [xvalFn(d), yvalFn(d)];});

    // Setup grouping
    var xgroupFn = facetA.group;
    var ygroupFn = facetB.group;
    var group = dimension.group(function(d) {
        return [xgroupFn(d[0]), ygroupFn(d[1])];
    }); 

    group.reduceCount();

    return {
        dimension: dimension,
        group: group,
        valueAccessor: function (d) {return d.value;},
    }; 
};

// Usecase: correlation chart
//  A continuous
//  B continuous
// Dataformat:
//  - only used with groupAll
//  group: { count: , xsum: , ysum: , xysum: , xxsum: , yysum:  }
// FIXME: see if this can be integrated with dxGlue2d
var dxGlue2 = function (facetA, facetB) {

    var xvalFn = facetA.value;
    var yvalFn = facetB.value;

    var dimension = window.app.crossfilter.dimension(function(d) {return d;});

    // Setup the map/reduce for the simple linear regression

    var statAdd = function (p,v) {
        var x = xvalFn(v);
        var y = yvalFn(v);
        if( x != misval && y != misval ) {
            p.count++;
            p.xsum += x;
            p.ysum += y;
            p.xysum += x * y;
            p.xxsum += x * x;
            p.yysum += y * y;
        }
        return p;
    };

    var statRemove = function (p,v) {
        var x = xvalFn(v);
        var y = yvalFn(v);
        if( x != misval && y != misval ) {
            p.count--;
            p.xsum -= x;
            p.ysum -= y;
            p.xysum -= x * y;
            p.xxsum -= x * x;
            p.yysum -= y * y;
        }
        return p;
    };

    var statInitial = function () {
        return {
            count: 0,
            xsum: 0,
            ysum: 0,
            xysum: 0,
            xxsum: 0,
            yysum: 0,
        }; 
    };

    // Setup grouping
    var group = dimension.groupAll();
    group.reduce(statAdd, statRemove, statInitial);

    return {
        dimension: dimension,
        group: group,
    }; 
};

// Usecase: stacked barchart
//   A: continuous or categorial
//   B: categorial: [ C1, C2, C3, ...]
// Dataformat:
//  [ {key: facetA.group(d), value: { C1: count(facetB.value(d)) A d = C1, C2: count(facetB.value(d)) A d = C2, ..., _total: sum 1}, ...]
// FIXME: implement facetC for value
var dxGlueAbyCatB = function (facetA, facetB) {
    var dimension = window.app.crossfilter.dimension(facetA.value);
    var group = dimension.group(facetA.group);
   
    var valueB = facetB.value;
    var domain = facetB.x.domain();

    group.reduce(
        function (p,v) {++p[valueB(v)]; ++p._total; return p;}, // add
        function (p,v) {--p[valueB(v)]; --p._total; return p;}, // subtract
        function () {                                           // initialize
            var result = {_total: 0};
            domain.forEach(function (f) {result[f] = 0;});
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
    dxGlue1: dxGlue1,
    dxGlue2: dxGlue2,
    dxGlue2d: dxGlue2d,
    dxDataGet: dxDataGet,
    dxGetCategories: dxGetCategories,
    dxGetPercentiles: dxGetPercentiles,
    dxGetExceedances: dxGetExceedances,
    dxGlueAbyCatB: dxGlueAbyCatB,
    dxGlueAwithBs: dxGlueAwithBs,
    misval: misval,
};
