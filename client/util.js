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
};
