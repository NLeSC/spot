var d3 = require('d3');

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

var dxGlue2 = function (facetA, facetB) {

    var dimension = window.app.crossfilter.dimension(function(d) {
        return [facetA.value(d), facetB.value(d)];
    });

    var group = dimension.group(function(d) {
        return [facetA.group(d[0]), facetB.group(d[1])]; 
    });

    group.reduceCount();

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
var dxGetCategories = function (facet) {

    var dimension = window.app.crossfilter.dimension(facet.basevalue);
    var group = dimension.group().reduceCount();

    var data = group.top(Infinity);
    dimension.dispose();

    return data;
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
    dxDataGet: dxDataGet,
    dxGetCategories: dxGetCategories,
};
