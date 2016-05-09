var Collection = require('ampersand-collection');
var CrossfilterFacet = require('./facet-crossfilter');
var util = require('../util');
var utildx = require('../util-crossfilter');
var misval = require('../misval');

// ********************************************************
// Dataset utility functions
// ********************************************************

// Draw a sample, and call a function with the sample as argument
var sampleData = function (count, cb) {
    var dimension = utildx.crossfilter.dimension(function (d){return d;});
    var data = dimension.top(count);
    dimension.dispose();

    cb(data);
};

var scanData = function (dataset) {
    var scanDataHelper = function (data) {
        var addfacet = function (path, value) {
            var type = 'categorial';
            var facet;

            // TODO: auto identify more types
            // types: ['continuous', 'categorial', 'time']
            if ( value == +value ) {
                type = 'continuous';
            }

            var f = dataset.add({name: path, accessor: path, type: type, description:'Automatically detected facet, please check configuration'});
            if (type == 'categorial') {
                f.getCategories;
            }
            else if (type == 'continuous') {
                f.getMinMaxMissing;
            }
        }

        var recurse = function (path, tree) {
            var props = Object.getOwnPropertyNames(tree);

            props.forEach(function(name) {
                var subpath;
                if (path) subpath = path + "." + name; else subpath = name;

                // add an array as categorial facet, ie. labelset, to prevent adding each element as separate facet
                // also add the array length as facet
                if(tree[name] instanceof Array) {
                    addfacet(subpath, tree[name]);
                    addfacet(subpath + ".length", tree[name].length);
                }
                // recurse into objects
                else if (tree[name] instanceof Object) {
                    recurse(subpath, tree[name]);
                }
                // add strings and numbers as facets
                else {
                    addfacet(subpath, tree[name]);
                }
            });
        };
        recurse("", data[10]);
    };

    sampleData(11, scanDataHelper);
};

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

var initDataFilter = function (widget) {
    var facetA = widget.primary;
    var facetB = widget.secondary;
    var facetC = widget.tertiary;

    if (! facetA) facetA = util.unitFacet;
    if (! facetC) facetC = facetB;
    if (! facetC) facetC = facetA;
    if (! facetB) facetB = util.unitFacet;

    var valueA = facetA.value;
    var valueB = facetB.value;
    var valueC = facetC.value;

    var groupA = facetA.group;
    var groupB = facetB.group;

    widget.dimension = utildx.crossfilter.dimension(function(d) {return valueA(d);});
    var group = widget.dimension.group(function(a) {return groupA(a);});

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

    widget.getData = function () {
        var result = [];
 
        // Get data from crossfilter
        var groups = group.all();

        // Unpack array dims
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
                    if (facetB == util.unitFacet) {
                        // we have subgroups, normalize wrt. the subgroup
                        value = 100.0 * value / group_totals[group.key];
                    }
                    else {
                        // no subgroups, normalize wrt. the full total
                        value = 100.0 * value / full_total;
                    }
                }
                result.push({
                    a: group.key,
                    b: subgroup,
                    c: value,
                });
            });
        });
        widget.data = result;
        widget.trigger('newdata');
    };

    // start retreiving data
    widget.getData();
};

var releaseDataFilter = function (widget) {
    if(widget.dimension) {
        widget.dimension.filterAll();
        widget.dimension.dispose();
        delete widget.dimension;
    }
};

var setDataFilter = function (widget) {
    if(widget.dimension) {
        widget.dimension.filterFunction(widget.filterFunction);
    }
};

module.exports = Collection.extend({
    model: CrossfilterFacet,
    comparator: function (left, right) {
        return left.name.localeCompare(right.name);
    },

    initDataFilter: initDataFilter,
    releaseDataFilter: releaseDataFilter,
    setDataFilter: setDataFilter,
    sampleData: sampleData,
    scanData: function () {scanData(this);},
});
