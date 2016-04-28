var misval = require('./misval');

// ************************************************
// Base value for given facet
// ************************************************

var facetBaseValueFn = function (facet) {

    if(facet.isUnity) {
        return function () {return ["1"];};
    }    

    var accessor;
    if(facet.isProperty) {
        // Nested properties can be accessed in javascript via the '.'
        // so we implement it the same way here.
        var path = facet.accessor.split('.');

        if(path.length == 1) {
            // Use a simple direct accessor, as it is probably faster than the more general case
            // and it was implemented already
            accessor = function (d) {
                var value = misval;
                if (d.hasOwnProperty(facet.accessor)) {
                    value = d[facet.accessor];

                    if(facet.misval.indexOf(value) > -1 || value == null) {
                        value = misval;
                    }
                }

                if (facet.isCategorial) {
                    if (value instanceof Array) {
                        return value;
                    }
                    else {
                        return [value];
                    }
                }
                return value;
            };
        }
        else {
            // Recursively follow the crumbs to the desired property
            accessor = function (d) {
                var i = 0;
                var value = d;

                for(i=0;i<path.length;i++) {
                    if (value.hasOwnProperty(path[i])) {
                        value = value[path[i]];
                    }
                    else {
                        value = misval;
                        break;
                    }
                }

                if(facet.misval.indexOf(value) > -1 || value == null) {
                    value = misval;
                }
                if (facet.isCategorial) {
                    if (value.length) {
                        return value;
                    }
                    else {            
                        return [value];
                    }
                }
                return value;
            };
        }
    }
    else if(facet.isMath) {
        var formula = math.compile(facet.accessor);

        accessor = function (d) {
            try {
                var value = formula.eval(d);
                return value;
            } catch (e) {
                return misval;
            }
        };
    }


    if(facet.isTime) {
        if(facet.isDuration) {
            var duration_format = facet.base_value_time_format;
            return function (d) {
                var value = accessor(d);
                if(value != misval) {
                    return moment.duration(parseFloat(value), duration_format);
                }
                return misval;
            };
        }
        else if(facet.isDatetime) {
            var time_format = facet.base_value_time_format;
            var time_zone = facet.base_value_time_zone;
            return function (d) {
                var value = accessor(d);
                if(value != misval) {
                    var m;
                    if(time_format.length > 0) {
                        m = moment(value, time_format);
                    }
                    else {
                        m = moment(value);
                    }
                    if(time_zone.length > 0) {
                        m.tz(time_zone);
                    }
                    return m;
                }
                return misval;
            };
        }
        else {
            console.error("Time base type not supported for facet", facet);
        }
    }
    else if(facet.isContinuous || facet.isCategorial) {
        return accessor;
    }
    else {
        console.error("Facet kind not implemented in facetBaseValueFn: ", facet );
    }
};


// **********************************************************************
// Create a function that returns the transformed value for this facet
// **********************************************************************

var facetValueFn = function (facet) {

    if(facet.isUnity) {
        return function (){return ["1"];};
    }    

    if (facet.isContinuous) 
        return continuousValueFn(facet);

    else if (facet.isCategorial) 
        return categorialValueFn(facet);

    else if (facet.isTime) 
        return timeValueFn(facet);

    console.error( "facetValueFn not implemented for facet type: ", facet );
}; 

var continuousValueFn = function (facet) {
    var bin, scale;
    var range = [];
    var domain = [];

    // get base value function
    var baseValFn = facetBaseValueFn(facet);

    // Parse numeric value from base value
    if (facet.transformNone) {
        return function (d) {
            var val = parseFloat(baseValFn(d));
            if (isNaN(val) || val == Infinity || val == -Infinity) {
                return misval;
            }
            return val;
        };
    }

    // Calulate percentiles, and setup mapping
    // Approximate precentiles:
    //  a) sort the data small to large
    //  b) find the nth percentile by taking the data at index:
    //     i ~= floor(0.01 * n * len(data))
    else if (facet.transformPercentiles) {
        var percentiles = getPercentiles(facet);

        // smaller than lowest value
        range.push(0.0);

        // all middle percentiles
        bin = 0;
        while(bin < percentiles.length - 1) {
            range.push(percentiles[bin].p);
            domain.push(percentiles[bin].x);
            bin++;
        }

        scale = d3.scale.threshold().domain(domain).range(range);
        return function(d) {
            return scale(baseValFn(d));
        };
    }

    // Calulate exceedances, and setup mapping
    // Approximate exceedances:
    //  a) sort the data small to large
    //  b) 1 in 3 means at 2/3rds into the data: trunc((3-1) * data.length/3) 
    else if (facet.transformExceedances) {
        var exceedances = getExceedances(facet);

        // smaller than lowest value
        range.push(exceedances[0].e);

        // all middle percentiles
        bin = 0;
        while(bin < exceedances.length) {
            range.push(exceedances[bin].e);
            domain.push(exceedances[bin].x);
            bin++;
        }

        scale = d3.scale.threshold().domain(domain).range(range);
        return function(d) {
            return scale(baseValFn(d));
        };
    }
};

var categorialValueFn = function (facet) {

    // get base value function
    var baseValFn = facetBaseValueFn(facet);

    return function (d) {

        // Map categories to a set of user defined categories 
        var relabel = function (hay) {

            // default to the raw value
            var val = hay;

            // Parse facet.categories to match against category_regexp to find group
            facet.categories.some(function (cat) {
                if(cat.category == hay) {
                    val = cat.group;
                    return true;
                }
                else {
                    return false;
                }
                // if(cat.category_regexp.test(hay)) {
                //     val = cat.group;
                //     return true;
                // }
                // else {
                //     return false;
                // }
            });
            return val;
        };

        var val = baseValFn(d);

        var i;
        for (i=0; i<val.length; i++) {
            val[i] = relabel(val[i]);
        }

        // sort alphabetically
        val.sort();

        return val;
    };
};

var timeValueFn = function (facet) {

    // get base value function
    var baseValFn = facetBaseValueFn(facet);
    var duration_format;
    var reference_moment;

    if(facet.isDatetime) {
        if(facet.transformNone) { // datetime -> datetime
            return baseValFn;
        }
        else if(facet.transformToDuration) {
            reference_moment = moment(facet.transform_time_reference);
            return function (d) {
                // see: 
                //  http://momentjs.com/docs/#/displaying/difference/
                //  http://momentjs.com/docs/#/durations/creating/
                var m = baseValFn(d);
                if (m == misval) {
                    return m;
                }
                return moment.duration(m.diff(reference_moment));
            };
        }
        else if(facet.transformTimezone) {
            return function (d) {
                // see: 
                //  http://momentjs.com/timezone/docs/#/using-timezones/
                var m = baseValFn(d);
                if (m == misval) {
                    return m;
                }
                return m.tz(facet.transform_time_zone);
            };
        }
        else {
            console.error("Time transform not implemented for facet", facet);
        }
    }
    else if (facet.isDuration) {
        if(facet.transformNone) { // duration -> duration
            duration_format = facet.base_value_time_format;
            return function (d) {
                var m = baseValFn(d);
                if (m == misval) {
                    return m;
                }
                return m.as(duration_format);
            };
        }
        else if(facet.transformToDuration) { // duration -> duration in different units
            duration_format = facet.transform_time_units;
            return function (d) {
                var m = baseValFn(d);
                if (m == misval) {
                    return m;
                }
                return m.as(duration_format);
            };
        }
        else if(facet.transformToDatetime) { // duration -> datetime
            reference_moment = moment(facet.transform_time_reference);
            return function (d) {
                var m = baseValFn(d);
                if (m == misval) {
                    return m;
                }
                var result = reference_moment.clone();
                return result.add(m);
            };
        }
        else {
            console.error("Time transform not implemented for facet", facet, facet.transform);
        }
        
    }
    else {
        console.error("Time type not implemented for facet", facet);
    }
};



// ********************************************************
// Create a function that returns group value for a facet
// ********************************************************

var facetGroupFn = function (facet) {

    if(facet.isUnity) {
        return function (){return ["1"];};
    }    

    if(facet.displayContinuous)
        return continuousGroupFn(facet);
    else if (facet.displayCategorial)
        return categorialGroupFn(facet);
    else if (facet.displayTime)
        return timeGroupFn(facet);

    console.error("Group function not implemented for facet", facet);
};

var continuousGroupFn = function (facet) {
    var bins = facet.bins;
    var nbins = bins.length;

    // FIXME: use some bisection to speed up 
    return function (d) {
        var i;
        if (d < bins[0].group[0] || d > bins[nbins-1].group[1]) {
            return misval;
        }

        i=0;
        while (d > bins[i].group[1]) {
            i++;
        } 
        return bins[i].label;
    };
};

var timeGroupFn = function (facet) {
    // Round the time to the specified resolution
    // see:
    //  http://momentjs.com/docs/#/manipulating/start-of/
    //  http://momentjs.com/docs/#/displaying/as-javascript-date/
    var time_bin = facet.grouping_time_format;
    var scale = function(d) {
        if (d == misval) {
            return d;
        }
        var datetime = d.clone();
        var result = datetime.startOf(time_bin);
        return result;
    };
    scale.domain = function () {
        return [moment(facet.minval_astext), moment(facet.maxval_astext)];
    };
    return scale;
};

var categorialGroupFn = function (facet) {
    // Don't do any grouping; that is done in the step from base value to value.
    // Matching of facet value and group could lead to a different ordering,
    // which is not allowed by crossfilter
    return function (d) {return d;};
};




// crossfilter dimensions are arrays for categorial facets,
// to implement multiple labels/tags per datapoint.
// This can result in quite messy datastructure returned by group.all()
// This function re-formats the data to be more regular
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
        console.error("Reduction not implemented for this facet", facet);
    }
    return null;
};


// General crosfilter function, takes three factes, and returns:
//  [{
//      A: facetA.group(d),
//      B: facetB.group(d),
//      C: reduce( facetC )
//  },...]
var init = function (facetA, facetB, facetC) {
    var valueA = facetValueFn(facetA); 
    var valueB = facetValueFn(facetB); 
    var valueC = facetValueFn(facetC); 

    var groupA = facetGroupFn(facetA); 
    var groupB = facetGroupFn(facetB);

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

// Usecase: find the range of a continuous facet, and detect missing data indicators, fi. -9999
var getMinMaxMissing = function (facet) {
    var basevalueFn = facetBaseValueFn(facet);
    var dimension = window.app.crossfilter.dimension(function (d) {return basevalueFn(d);});

    var group = dimension.group(function(d){
        var g;
        var order = 0;
        if(d == +d) {
            if(d<0) {
                order = Math.trunc(Math.log(-d) / Math.log(10));
                g = -Math.exp(order * Math.log(10.0)) 
            }
            else if (d>0) {
                order = Math.trunc(Math.log(d) / Math.log(10));
                g = Math.exp(order * Math.log(10.0)) 
            }
            else {
                g = 0;
            }
        }
        else {
            g = Infinity;
        }
        return g;
    });

    group.reduce(
        function (p,v) { // add
            var d = basevalueFn(v);
            if (d<p.min) p.min = d;
            if (d>p.max) p.max = d;
            p.count++;
            return p;
        },
        function (p,v) { // subtract
            p.count--;
            return p;
        },
        function () { // initialize
            return {min: Number.MAX_VALUE, max: -Number.MAX_VALUE, count: 0};
        }
    );

    var groups = group.top(Infinity);
    groups.sort(function compare(a,b) {
        if (a.key < b.key) return -1;
        if (a.key > b.key) return 1;
        return 0;
     });
    dimension.dispose();

    var min = Number.MAX_VALUE, max = -Number.MAX_VALUE, missing = [];

    var i = 0;
    // minimum value:
    // 1) first bin with more than one distinct value
    // 2) separated with a gap of more than 2 orders of magnitude than the rest
    if (groups.length > 1) {
        if ((Math.abs(groups[0].value.max / groups[1].value.min) > 1000.0) && groups[1].key != Infinity ) {
            missing.push(groups[i].value.min.toString());
            i++;
        }
    }
    min = groups[i].value.min;

    // maximum value:
    // 1) last bin with more than one distinct value
    // 2) separated with a gap of more than 2 orders of magnitude than the rest
    i = groups.length - 1;
    if(groups[i].key == Infinity) i--;
    if(i>1) {
        if (Math.abs(groups[i].value.min / groups[i-1].value.max) > 1000.0) {
            missing.push(g.value.min.toString());
            i--;
        }
    }
    max = groups[i].value.max;
    missing = JSON.stringify(missing);

    return [min.toString(), max.toString(), "Missing"];
};

// Usecase: find all values on an ordinal (categorial) axis
var getCategories = function (facet) {

    var basevalueFn = facetBaseValueFn(facet);
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
var getPercentiles = function (facet) {
    var basevalueFn = facetBaseValueFn(facet);
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
var getExceedances = function (facet) {
    var basevalueFn = facetBaseValueFn(facet);
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

// Return count data elements
var sampleData = function (count) {
    var dimension = window.app.crossfilter.dimension(function (d){return d;});
    var data = dimension.top(count);
    dimension.dispose();
    return data;
};

module.exports = {
    init:                  init,
    getMinMaxMissing:      getMinMaxMissing,
    getCategories:         getCategories,
    getPercentiles:        getPercentiles,
    getExceedances:        getExceedances,
    sampleData:            sampleData,
};
