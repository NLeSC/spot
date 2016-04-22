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

    var data = dimension.top(20);
    var props = Object.getOwnPropertyNames(data[10]);

    // FIXME: nested properties
    props.forEach(function(name) {
        var type;
        var value = data[10][name];
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

// Returns a function that further reduces the crossfilter group
// to a single value, depending on sum/count/average settings of facet
// returns function(d) => c, where d := { sum: ..., count: ... }
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
        console.log("Reduction not implemented for this facet", facet);
    }
    return null;
};

// A dummy facet to simplify implementation
// returns a single group with key 1 and value 1,
// with reduceCount and reduceAbsolute
var unitFacet = {
    value: function () {return 1;},
    group: function () {return 1;},

    isContinuous: false,
    isCategorial: true,

    reduceSum: false,
    reduceCount: true,
    reduceAverage: false,

    reduceAbsolute: true,
    reducePercentage: false,  
};

// General crosfilter function, takes three factes, and returns:
//  [{
//      A: facetA.group(d),
//      B: facetB.group(d),
//      C: reduce( facetC )
//  },...]
var dxInit = function (facetA, facetB, facetC) {
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

            var val = facetC.value(v);
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

            var val = facetC.value(v);
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

    var reduce = reduceFn(facetC);

    var data = function () {
        var result = [];
 
        // Get data from crossfilter
        var groups = group.all();

        // Array dims
        groups = dxUnpackArray(groups);

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


var dxUnpackArray = function (groups) {

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

// Usecase: find all values on an ordinal (categorial) axis
var dxGetCategories = function (facet) {

    var basevalueFn = facet.basevalue;
    var dimension = window.app.crossfilter.dimension(function (d) {return basevalueFn(d);});

    var group = dimension.group(function(d){return d;});
    group.reduce(
        function (p,v) { // add
            p["1"].count++;
            return p;
        },
        function (p,v) { // subtract
            p["1"].count--;
            return p;
        },
        function () { // initialize
            return {"1": {count: 0, sum: 0}};
        }
    );

    var data = dxUnpackArray(group.top(Infinity));
    dimension.dispose();

    data.sort(function compare(a,b) {
        if (a.key < b.key) return -1;
        if (a.key > b.key) return 1;
        return 0;
     });

    var categories = [];
    data.forEach(function (d) {
        // NOTE: numbers are parsed: so not {key:'5', 20} but {key:5, value: 20}
        var key_as_string = d.key.toString();

        var group_as_string;
        if (key_as_string == misval) {
            group_as_string = facet.misval[0];
        }
        else {
            group_as_string = key_as_string;
        }
        categories.push({category: key_as_string, count: d.value["1"].count, group: group_as_string});
    });

    return categories;
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


module.exports = {
    dxGetCategories:  dxGetCategories,
    dxGetPercentiles: dxGetPercentiles,
    dxGetExceedances: dxGetExceedances,
    dxInit: dxInit,

    unitFacet: unitFacet,
    misval: misval,

    scanData: scanData,
};
