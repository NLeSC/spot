// ********************************************
// Utility functions for crossfilter datasets
// ********************************************

// crossfilter dimensions are arrays for categorial facets,
// to implement multiple labels/tags per datapoint.
// This can result in quite messy datastructure returned by group.all()
// This function re-formats the data to be more regular
var unpackArray = function (groups) {

    // values := {count: 0, sum: 0}
    // key: {'a':{count: 0, sum 0}, 'b':{count: 0, sum 0} }
    var merge = function (key,values) {

        Object.keys(values).forEach(function(subgroup) {
            if(new_keys[key]) {
                new_keys[key][subgroup] = new_keys[key][subgroup] || {count:0, sum: 0};
                new_keys[key][subgroup].count += values[subgroup].count;
                new_keys[key][subgroup].sum += values[subgroup].sum;
            }
            else {
                new_keys[key] = {};
                new_keys[key][subgroup] = {count: values[subgroup].count, sum: values[subgroup].sum};
            }
        });
    };

    var new_keys = {};
    groups.forEach(function (group) {
        if (group.key instanceof Array) {
            group.key.forEach(function (subkey) {
                merge(subkey, group.value);
            });
        }
        else {
            merge(group.key, group.value);
        }
    });

    var new_groups = [];
    Object.keys(new_keys).forEach(function (key) {
        new_groups.push({key: key, value: new_keys[key]});
    });

    return new_groups;
};


// Returns a function that further reduces the crossfilter group
// to a single value, depending on sum/count/average settings of facet
// returns function(d) => c, where d := { sum: ..., count: ... }
// FIXME: cummulative sums
var reduceFn = function(facet) {

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
        console.error("Reduction not implemented for this facet", facet);
    }
    return null;
};

module.exports = {
    unpackArray: unpackArray,
    reduceFn: reduceFn,
};
