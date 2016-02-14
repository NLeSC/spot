var d3 = require('d3');


var misval = Number.MAX_VAL; // "No Data";

/** 
 * Filter implementation specific: 
 *
 *   crossfilter objects to be passed directly to a dc chart:
 *   dx_dimension dx.filter()       for chart.dimension()
 *   dx_group     dx.filter.group() contains the group operations; for chart.group()
 */
var dxGlue1 = function (facet) {

    var dimension = window.app.crossfilter.dimension(facet.value);
    var group = dimension.group(facet.group); 

    if (facet.reduceSum) {
        group.reduceSum(facet.value);
    }
    else if (facet.reduceCount) {
        group.reduceCount();
    }

    return {
        dimension: dimension,
        group: group
    }; 
};

// Usecase: scatterplot
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
        group: group
    }; 
};

// Usecase: correlation chart
var dxGlue2 = function (facetA, facetB) {

    var xvalFn = facetA.value;
    var yvalFn = facetB.value;

    var dimension = window.app.crossfilter.dimension(function(d) {return d;});

    // Setup the map/reduce for the simple linear regression

    var reduceAdd = function (p,v) {
        var x = xvalFn(v);
        var y = yvalFn(v);
        if( x != Infinity && y != Infinity ) {
            p.count++;
            p.xsum += x;
            p.ysum += y;
            p.xysum += x * y;
            p.xxsum += x * x;
            p.yysum += y * y;
        }
        return p;
    };

    var reduceRemove = function (p,v) {
        var x = xvalFn(v);
        var y = yvalFn(v);
        if( x != Infinity && y != Infinity ) {
            p.count--;
            p.xsum -= x;
            p.ysum -= y;
            p.xysum -= x * y;
            p.xxsum -= x * x;
            p.yysum -= y * y;
        }
        return p;
    };

    var reduceInitial = function () {
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
    group.reduce(reduceAdd, reduceRemove, reduceInitial);

    return {
        dimension: dimension,
        group: group
    }; 
};

// Usecase: stacked barchart
// sum of payments per month, stacked by cateogry
// SELECT MONTHGROUP(month) AS month, category, SUM(payments) FROM data GROUP BY month, category
// returns: [month] = {category:  sum(payments), ... }
var dxGlueAbyB = function (facetA, facetB) {
    var dimension = window.app.crossfilter.dimension(facetA.value);
    var group = dimension.group(facetA.group);
    
    group.reduce(
        // add
        function (p,v) {
            var subkey = facetB.value(v);
            if(facetB.reduceCount) {
                p[subkey] += 1;
            }
            else if (facetB.reduceSum) {
                p[subkey] += facetB.value(p);
            }
            return p;
        },
        // subtract
        function (p,v) {
            var subkey = facetB.value(v);
            if(facetB.reduceCount) {
                p[subkey] -= 1;
            }
            else if (facetB.reduceSum) {
                p[subkey] -= facetB.value(p);
            }
            return p;
        },
        // initialize
        function () {
            var result = {};
            facetB.scale.domain().forEach(function (f) {
                result[f] = 0;
            });
            return result;
    });

    return {
        dimension: dimension,
        group: group
    };
};

// Usecase: find all values on an oridnal (categorial) axis
// returns Array [ {key: .., value: ...}, ... ]
// NOTE: numbers are parsed: so not {key:'5', 20} but {key:5, value: 20}
var dxGetCategories = function (facet) {

    var dimension = window.app.crossfilter.dimension(facet.value);
    var group = dimension.group().reduceCount();

    var data = group.top(Infinity);
    dimension.dispose();

    return data;
};

// Usecase: calculate percentiles from the facet data, using crossfilter
// For an input of count==4 it gives:
// [{value: ..., label: 25}, {value: ..., label: 50},{value: ..., label: 75}]
// returns 
var dxGetPercentiles = function (facet, count) {

    var rawValue = function(d) {
        var val = parseFloat(facet.basevalue(d));
        if (isNaN(val) || val == Infinity || val == -Infinity) {
            return misval;
        }
        return val;
    };

    var dimension = window.app.crossfilter.dimension(rawValue);
    var data = dimension.bottom(Infinity);

    var percentiles = [];
    var p = 1;
    var val = 0;

    while(p < count) {
        var i     = Math.trunc((p * 1.0 / count) * data.length);
        val = rawValue(data[i]);
        percentiles.push({value: val, label: Math.trunc(p*100.0 / count)});
        p++;
    }
    return percentiles;
};


// FIXME: creating and disposing dimension is slow.. maybe keep it around somewhere..
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
    misval: misval,
};
