var Collection = require('ampersand-collection');
var CrossfilterFacet = require('./facet-crossfilter');
var utildx = require('../util-crossfilter');
var misval = require('../misval');

// ********************************************************
// Dataset utility functions
// ********************************************************

// Return count data elements
var sampleData = function (count) {
    var dimension = window.app.crossfilter.dimension(function (d){return d;});
    var data = dimension.top(count);
    dimension.dispose();
    return data;
};


// ********************************************************
// Data callback function
// ********************************************************

// General crosfilter function, takes three factes, and returns:
// { data: function () ->
//  [{
//      A: facetA.group(d),
//      B: facetB.group(d),
//      C: reduce( facetC )
//  },...]
//  dimension: crossfilter.dimension()
// }

var initFilter = function (facetA, facetB, facetC) {
    var valueA = facetA.value; 
    var valueB = facetB.value; 
    var valueC = facetC.value; 

    var groupA = facetA.group; 
    var groupB = facetB.group;

    var dimension = window.app.crossfilter.dimension(function(d) {return valueA(d);});
    var group = dimension.group(function(a) {return groupA(a);});

    group.reduce(
        function (p,v) { // add
            var bs = groupB(valueB(v));
            if(! (bs instanceof Array)) {
                bs = [bs];
            };

            var val = valueC(v);
            bs.forEach(function(b) {
                p[b] = p[b] || {count: 0, sum: 0};

                if(val != misval) {
                    p[b].count++;
                    if( val = +val ) {
                        p[b].sum += val;
                    }
                }
            });
            return p;
        },
        function (p,v) { // subtract
            var bs = groupB(valueB(v));
            if(! (bs instanceof Array)) {
                bs = [bs];
            };

            var val = valueC(v);
            bs.forEach(function(b) {
                if(val != misval) {
                    p[b].count--;
                    if( val = +val ) {
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

    var data = function () {
        var result = [];
 
        // Get data from crossfilter
        var groups = group.all();

        // Array dims
        groups = utildx.unpackArray(groups);

        // Post process

        // sum groups to calculate relative values
        var full_total = 0;
        var group_totals = {};
        groups.forEach(function (group) {
            Object.keys(group.value).forEach(function (subgroup) {
                var value = reduce(group.value[subgroup]);
                group_totals[group.key] = group_totals[group.key] || 0;
                group_totals[group.key] += value;
                full_total += value;
            });
        });

        // re-format the data
        groups.forEach(function (group) {
            Object.keys(group.value).forEach(function (subgroup) {

                // normalize
                var value = reduce(group.value[subgroup]);
                if (facetC.reducePercentage) {
                    if (facetB) {
                        // we have subgroups, normalize wrt. the subgroup
                        value = 100.0 * value / group_totals[group.key];
                    }
                    else {
                        // no subgroups, normalize wrt. the full total
                        value = 100.0 * value / full_total;
                    }
                }
                result.push({
                    A: group.key,
                    B: subgroup,
                    C: value,
                });
            });
        });
        return result;
    };

    return {
        data: data,
        dimension: dimension,
    };
};

var releaseFilter = function (handle) {
    if (handle) {
        if(handle.dimension) {
            handle.dimension.filterAll();
            handle.dimension.dispose();
            delete handle.dimension;
        }
    }
};

var setFilter = function (handle) {
    if (handle) {
        if(handle.dimension) {
            handle.dimension.filterFunction(handle.widget._filterFunction);
        }
    }
};

module.exports = Collection.extend({
    model: CrossfilterFacet,
    comparator: function (left, right) {
        return left.name.localeCompare(right.name);
    },

    initFilter: initFilter,
    releaseFilter: releaseFilter,
    setFilter: setFilter,
    sampleData: sampleData,
});
