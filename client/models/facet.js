var AmpersandModel = require('ampersand-model');
var categoryItemCollection = require('../models/categoryitem-collection');

var moment = require('moment-timezone');
var math = require('mathjs');
var d3 = require('d3');
var util = require('../util');



// bins := {
//    label: <string>                          text for display
//    group: <string> || [<number>, <number>]  domain of this grouping
//    value: <string> || <number>              a value guaranteed to be in this group
// }
// 
var facetBinsFn = function (facet) {
    var param = facet.grouping_continuous_bins;
    var x0, x1, size, nbins;
    var i, label;

    var bins = [];

    if(facet.isContinuous) {

        // A fixed number of equally sized bins
        if(facet.groupFixedN) {
            nbins = param;
            x0 = facet.minval;
            x1 = facet.maxval;
            size = (x1-x0) / nbins;
        }

        // A fixed bin size
        else if (facet.groupFixedS) {
            size = param;
            x0 = Math.floor(facet.minval/size) * size;
            x1 = Math.ceil(facet.maxval/size) * size;
            nbins = (x1 - x0) / size;
        }

        // A fixed bin size, centered on 0
        else if (facet.groupFixedSC) {
            size = param;
            x0 = (Math.floor(facet.minval/size) - 0.5) * size;
            x1 = (Math.ceil(facet.maxval/size) + 0.5) * size;
            nbins = (x1 - x0) / size;
        }

        // Fixed number of logarithmically (base 10) sized bins
        else if (facet.groupLog) {
            nbins = param;
            x0 = Math.floor(Math.log(facet.minval)/Math.log(10.0));
            x1 = Math.ceil(Math.log(facet.maxval)/Math.log(10.0));
            size = (x1 - x0) / nbins;
        }

        var xm, xp;
        for(i=0; i<nbins; i++) {
            xm = x0 + i * size;
            xp = x0 + (i + 1) * size;
            if(facet.groupLog) {
                // print with a precission of 4 decimals
                xm = Math.exp(xm * Math.log(10.0)).toPrecision(4); xm = +xm;
                xp = Math.exp(xp * Math.log(10.0)).toPrecision(4); xp = +xp;
                label = xm + " - " + xp;
            }
            else {
                label = 0.5 * (xm + xp);
            }
            bins.push({label: label, group: [xm,xp], value: 0.5 * (xm + xp)});
        }
    }

    else if (facet.isCategorial) {
        facet.categories.forEach(function(category,i) {
            bins[i]={label: category.group, group: category.group, value: category.group};
        });
    }
    else {
        console.error("Bins function not implemented for facet", facet);
    }
    return bins;
};


// General functionality
// 
//   value  function that returns the value associated with the facet, for a specific data object
//   group  function that returns the group containing the data object 
//          implemented as a d3.scale object 


// Base value for given facet
var facetBaseValueFn = function (facet) {

    var accessor;
    if(facet.isProperty) {
        // Nested properties can be accessed in javascript via the '.'
        // so we implement it the same way here.
        var path = facet.accessor.split('.');

        if(path.length == 1) {
            // Use a simple direct accessor, as it is probably faster than the more general case
            // and it was implemented already
            accessor = function (d) {
                var value = util.misval;
                if (d.hasOwnProperty(facet.accessor)) {
                    value = d[facet.accessor];

                    if(facet.misval.indexOf(value) > -1 || value == null) {
                        value = util.misval;
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
                        value = util.misval;
                        break;
                    }
                }

                if(facet.misval.indexOf(value) > -1 || value == null) {
                    value = util.misval;
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
                return util.misval;
            }
        };
    }

    // FIXME
    if(facet.isNetwork) {
        // For network data, we need both 'from' and 'to' properties
        console.error("Network facets not implemented");
        return util.misval;
    }

    // FIXME
    else if(facet.isSpatial) {
        console.error("Spatial facets not implemented");
        return util.misval;
    }

    else if(facet.isTime) {
        if(facet.isDuration) {
            var duration_format = facet.base_value_time_format;
            return function (d) {
                var value = accessor(d);
                if(value != util.misval) {
                    return moment.duration(parseFloat(value), duration_format);
                }
                return util.misval;
            };
        }
        else if(facet.isDatetime) {
            var time_format = facet.base_value_time_format;
            var time_zone = facet.base_value_time_zone;
            return function (d) {
                var value = accessor(d);
                if(value != util.misval) {
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
                return util.misval;
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
                return util.misval;
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
        var percentiles = util.dxGetPercentiles(facet);

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
        var exceedances = util.dxGetExceedances(facet);

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
                if (m == util.misval) {
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
                if (m == util.misval) {
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
                if (m == util.misval) {
                    return m;
                }
                return m.as(duration_format);
            };
        }
        else if(facet.transformToDuration) { // duration -> duration in different units
            duration_format = facet.transform_time_units;
            return function (d) {
                var m = baseValFn(d);
                if (m == util.misval) {
                    return m;
                }
                return m.as(duration_format);
            };
        }
        else if(facet.transformToDatetime) { // duration -> datetime
            reference_moment = moment(facet.transform_time_reference);
            return function (d) {
                var m = baseValFn(d);
                if (m == util.misval) {
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

// Create a function that returns the transformed value for this facet
var facetValueFn = function (facet) {

    if (facet.isContinuous) 
        return continuousValueFn(facet);

    else if (facet.isCategorial) 
        return categorialValueFn(facet);

    else if (facet.isTime) 
        return timeValueFn(facet);

    else {
        console.error( "facetValueFn not implemented for facet type: ", facet );
        return null;
    }
}; 


var continuousGroupFn = function (facet) {
    var bins = facet.bins;
    var nbins = bins.length;

    // FIXME: use some bisection to speed up 
    return function (d) {
        var i;
        if (d < bins[0].group[0] || d > bins[nbins-1].group[1]) {
            return util.missing;
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
        if (d == util.misval) {
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


var facetGroupFn = function (facet) {
    if(facet.displayContinuous)
        return continuousGroupFn(facet);
    else if (facet.displayCategorial)
        return categorialGroupFn(facet);
    else if (facet.displayTime) {
        return timeGroupFn(facet);
    }
    else {
        console.error("Group function not implemented for facet", facet);
    }
};


module.exports = AmpersandModel.extend({
    props: {
        show: [ 'boolean', false, true ],
        active: [ 'boolean', false, false ],

        // general facet properties
        description: ['string', true, ''], // data-hook: general-description-input
        units: ['string', true, ''],       // data-hook: general-units-input
        name: ['string', true, ''],        // data-hook: general-title-input

        // properties for type
        type: {type:'string', required: true, default: 'continuous', values: ['continuous', 'categorial', 'spatial', 'time', 'network']},

        // properties for base-value-general
        accessor: ['string',false,null], // property or mathjs string
        bccessor: ['string',false,null], // property or mathjs string
        misval_astext: ['string', true, 'Infinity'],
        kind: {type:'string', required:true, default: 'property', values: ['property', 'math']},

        // properties for base-value-time
        base_value_time_format:    ['string', false, ''], // passed to momentjs
        base_value_time_zone:      ['string', false, ''], // passed to momentjs
        base_value_time_type:      {type: 'string', required: true, default: 'datetime', values: ['datetime', 'duration']},

        // properties for transform
        transform:  {type:'string', required: true, default: 'none', values: [
            'none',
            'percentiles', 'exceedances',           // continuous 
            'timezone', 'todatetime', 'toduration'  // time
        ]},

        // properties for transform-categorial

        // properties for transform-time
        transform_time_units:     ['string', false, ''], // passed to momentsjs
        transform_time_zone:      ['string', false, ''], // passed to momentsjs
        transform_time_reference: ['string', false, ''], // passed to momentsjs

        // properties for grouping-general
        minval_astext: ['string', true, '0'],   // data-hook: grouping-general-minimum
        maxval_astext: ['string', true, '100'], // data-hook: grouping-general-maximum

        // properties for grouping-continuous
        grouping_continuous_bins: ['number', true, 20 ],
        grouping_continuous:      {type: 'string', required: true, default: 'fixedn', values: ['fixedn', 'fixedsc', 'fixeds', 'log']},

        // properties for grouping-time
        grouping_time_format: ['string',true,'hours'], // passed to momentjs

        // properties for reduction
        reduction: {type:'string', required: true, default: 'count', values: ['count', 'sum', 'average']},
        reduction_type: {type:'string', required: true, default: 'absolute', values: ['absolute', 'percentage']},
    },

    collections: {
        // categoryItemCollection containing regular expressions for the mapping of facetValue to category
        categories: categoryItemCollection,
    },

    derived: {

        // properties for: type
        isContinuous: {
            deps: ['type'],
            fn: function () {
                return this.type == 'continuous';
            },
            cache: false,
        },
        isCategorial: {
            deps: ['type'],
            fn: function () {
                return this.type == 'categorial';
            },
            cache: false,
        },
        isSpatial: {
            deps: ['type'],
            fn: function () {
                return this.type == 'spatial';
            },
            cache: false,
        },
        isTime: {
            deps: ['type'],
            fn: function () {
                return this.type == 'time';
            },
            cache: false,
        },
        isNetwork: {
            deps: ['type'],
            fn: function () {
                return this.type == 'network';
            },
            cache: false,
        },


        // determine actual type from type + transform
        displayType: {
            deps: ['type','transform','base_value_time_type'],
            fn: function () {

                //if(this.type == 'continuous') {
                //    if(this.transform == 'percentiles') {
                //        return 'categorial';
                //    }
                //}
                if(this.type == 'time') {
                    if(this.base_value_time_type == 'datetime' && this.transform == 'toduration') {
                        return 'continuous';
                    }
                    else if(this.base_value_time_type == 'duration' && this.transform == 'none') {
                        return 'continuous';
                    }
                    else if(this.base_value_time_type == 'duration' && this.transform == 'toduration') {
                        return 'continuous';
                    }
                }

                return this.type;
            },
            cache: false,
        },
        displayContinuous: {
            deps: ['displayType'],
            fn: function () {
                return this.displayType == 'continuous';
            },
            cache: false,
        },
        displayCategorial: {
            deps: ['displayType'],
            fn: function () {
                return this.displayType == 'categorial';
            },
            cache: false,
        },
        displaySpatial: {
            deps: ['displayType'],
            fn: function () {
                return this.displayType == 'spatial';
            },
            cache: false,
        },
        displayTime: {
            deps: ['displayType'],
            fn: function () {
                return this.displayType == 'time';
            },
            cache: false,
        },
        displayNetwork: {
            deps: ['displayType'],
            fn: function () {
                return this.displayType == 'network';
            },
            cache: false,
        },

        // properties for: base-value
        misval: {
            deps: ['misval_astext'],
            fn: function () {
                // Parse the text content as a JSON array:
                //  - strings should be quoted
                //  - numbers unquoated
                //  - special numbers not allowed: NaN, Infinity
                try {
                    return JSON.parse('[' + this.misval_astext + ']');
                } catch (e) {
                    return ["Missing"];
                }
            },
        },
        isProperty: {
            deps: ['kind'],
            fn: function () {
                return this.kind == 'property';
            },
            cache: false,
        },
        isMath: {
            deps: ['kind'],
            fn: function () {
                return this.kind == 'math';
            },
            cache: false,
        },

        // properties for: base-value-time
        isDatetime: {
            deps: ['base_value_time_type'],
            fn: function () {
                return this.base_value_time_type == 'datetime';
            },
            cache: false,
        },
        isDuration: {
            deps: ['base_value_time_type'],
            fn: function () {
                return this.base_value_time_type == 'duration';
            },
            cache: false,
        },

        // properties for: transform-continuous
        transformNone: {
            deps: ['transform'],
            fn: function () {
                return this.transform == 'none';
            },
            cache: false,
        },
        transformPercentiles: {
            deps: ['transform'],
            fn: function () {
                return this.transform == 'percentiles';
            },
            cache: false,
        },
        transformExceedances: {
            deps: ['transform'],
            fn: function () {
                return this.transform== 'exceedances';
            },
            cache: false,
        },

        // properties for: transform-time
        transformTimezone: {
            deps: ['transform'],
            fn: function () {
                return this.transform == 'timezone';
            },
            cache: false,
        },
        transformToDatetime: {
            deps: ['transform'],
            fn: function () {
                return this.transform == 'todatetime';
            },
            cache: false,
        },
        transformToDuration: {
            deps: ['transform'],
            fn: function () {
                return this.transform == 'toduration';
            },
            cache: false,
        },

        // properties for grouping-general
        minval: {
            deps: ['minval_astext'],
            fn: function () {
                return parseFloat(this.minval_astext); // FIXME: use proper accessor instead of parseFloat
            }
        },
        maxval: {
            deps: ['maxval_astext'],
            fn: function () {
                return parseFloat(this.maxval_astext); // FIXME: use proper accessor instead of parseFloat
            }
        },

        // properties for grouping-continuous
        groupFixedN: {
            deps: ['grouping_continuous'],
            fn: function () {
                return this.grouping_continuous == 'fixedn';
            }
        },
        groupFixedSC: {
            deps: ['grouping_continuous'],
            fn: function () {
                return this.grouping_continuous == 'fixedsc';
            }
        },
        groupFixedS: {
            deps: ['grouping_continuous'],
            fn: function () {
                return this.grouping_continuous == 'fixeds';
            }
        },
        groupLog: {
            deps: ['grouping_continuous'],
            fn: function () {
                return this.grouping_continuous == 'log';
            }
        },

        // properties for reduction
        reduceCount: {
            deps: ['reduction'],
            fn: function () {
                return this.reduction == 'count';
            }
        },
        reduceSum: {
            deps: ['reduction'],
            fn: function () {
                return this.reduction == 'sum';
            }
        },
        reduceAverage: {
            deps: ['reduction'],
            fn: function () {
                return this.reduction === 'average';
            }
        },
        reduceAbsolute: {
            deps: ['reduction_type'],
            fn: function () {
                return this.reduction_type === 'absolute';
            }
        },
        reducePercentage: {
            deps: ['reduction_type'],
            fn: function () {
                return this.reduction_type === 'percentage';
            }
        },


        // Complex methods on the facet
        basevalue: {
            deps: ['type','accessor', 'bccessor', 'misval', 'kind', 'base_value_time_format', 'base_value_time_zone', 'base_value_time_type'],
            fn: function () {
                return facetBaseValueFn(this);
            },
            cache: false,
        },
        value: {
            deps: ['type', 'basevalue','transform', 'transform_time_units', 'transform_time_zone', 'transform_time_reference'],
            fn: function () {
                return facetValueFn(this);
            },
            cache: false,
        },
        group: {
            deps: ['value','displayType','grouping_continuous_bins','grouping_continuous','grouping_time_format'],
            fn: function () {
                return facetGroupFn(this);
            },
            cache: false,
        },
        bins: {
            deps: ['type', 'minval', 'maxval', 'grouping_continuous', 'grouping_continuous_bins','categories'],
            fn: function () {
                return facetBinsFn(this);
            },
        },
    },

    // Session properties are not typically be persisted to the server, 
    // and are not returned by calls to toJSON() or serialize().
    session: {
        modelType: ['string',true,'facet'], // Checked when setting widget.primary etc.
    },
});
