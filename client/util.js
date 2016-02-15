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

    var reduceRemove = function (p,v) {
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
// returns: [month,...] = {category:  count(payments), _total: count(all payments)... }
var dxGlueAbyB = function (facetA, facetB) {
    var dimension = window.app.crossfilter.dimension(facetA.value);
    var group = dimension.group(facetA.group);
   
    var valueB = facetB.value;
    var domain = facetB.x.domain();

    group.reduce(
        function (p,v) {++p[valueB(v)]; ++p._total; return p; }, // add
        function (p,v) {--p[valueB(v)]; --p._total; return p; }, // subtract
        function () {                                               // initialize
            var result = {_total: 0};
            domain.forEach(function (f) {result[f] = 0;});
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
    dxGlueAbyB: dxGlueAbyB,
    misval: misval,
};
