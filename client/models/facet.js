var AmpersandModel = require('ampersand-model');
var categoryItemCollection = require('../models/categoryitem-collection');

var moment = require('moment');
var math = require('mathjs');
var d3 = require('d3');
var dc = require('dc');
var util = require('../util');

// General functionality
// 
//   value  function that returns the value associated with the facet, for a specific data object
//   group  function that returns the group containing the data object 
//          implemented as a d3.scale object 

// For plotting with dc, to be passed directly to the chart:
//
//   x         a d3.scale object containing [min,max], linear/log etc. for chart.x()
//   xUnits    for counting number of groups in a range, for chart.xUnits()


var xUnitsFn = function (facet) {
    if(facet.isContinuous && facet.isPercentile) {
        return dc.units.ordinal;
    }

    if (facet.isContinuous) {
        return function(start, end, domain) {
            return d3.bisect(facet.group.domain(), end) - d3.bisect(facet.group.domain(), start);
        };
    }
    else if (facet.isCategorial) {
        return dc.units.ordinal;
    }

    console.log( "xUnitsFn not implemented for: ", facet.type, facet.kind);
    return;
};

var xFn = function (facet) {
    if (facet.isContinuous && facet.isPercentile) {
        return d3.scale.ordinal(); // FIXME: without listing all categories, the ordering is not defined
    }
    else if (facet.isContinuous) {
        if (facet.isLog) {
            return d3.scale.log().domain([facet.minval, facet.maxval]);
        }
        else {
            return d3.scale.linear().domain([facet.minval, facet.maxval]);
        }
    }
    else if (facet.isCategorial) {

        var domain = [];

        facet.categories.forEach(function(cat) {
            domain.push(cat.group);
        }); 
        domain.sort();

        return d3.scale.ordinal().domain(domain);
    }

    console.log( "xFn not implemented for: ", facet.type, facet.kind);
    return;
};

// Base value for given facet
var facetBaseValueFn = function (facet) {

    // FIXME
    if(facet.isNetwork) {
        // For network data, we need both 'from' and 'to' properties
        console.log("Network facets not implemented");
        return util.misval;
    }

    // FIXME
    if(facet.isSpatial) {
        console.log("Spatial facets not implemented");
        return util.misval;
    }

    if(facet.isProperty) {
        return function (d) {
            var val = util.misval;
            if (d.hasOwnProperty(facet.accessor)) {
                val = d[facet.accessor];
            }
            if(facet.misval.indexOf(val) > -1) {
                return util.misval;
            }
            return val;
        };
    }

    else if(facet.isMath) {
        var formula = math.compile(facet.accessor);

        return function (d) {
            var val = formula.eval(d); // TODO: catch errors
            return val;
        };
    }

    else {
        console.log("Facet kind not implemented in facetBaseValueFn: ", facet );
        return null;
    }
};

var continuousFacetValueFn = function (facet) {

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
    else if (facet.transformPercentiles) {
        var param = facet.grouping_continuous_bins; // FIXME: bins for percentiles?
        param = param < 2 ? 2 : param;

        // We need to go from this:
        //     [{value: ..., label: 25}, {value: ..., label: 50},{value: ..., label: 75}]
        // to this:
        //     d3.scale.threshold().domain([1,2]).range(['hello','world','again'])

        var percentiles = util.dxGetPercentiles(facet, param);
        var range = [];
        var domain = [];

        // smaller than lowest percentile
        var label = `0 - ${percentiles[0].label} (< ${percentiles[0].value})`;
        range.push(label);

        // all middle percentiles
        var bin = 0;
        while(bin < percentiles.length - 1) {

            label = `${percentiles[bin].label} (${percentiles[bin].value}) - ${percentiles[bin+1].label} (${percentiles[bin+1].value})`;
            range.push(label);
            domain.push(percentiles[bin].value);

            bin++;
        }

        // larger than last percentile
        label = `${percentiles[bin].label} - 100 (> ${percentiles[bin].value})`;
        range.push(label);
        domain.push(percentiles[bin].value);

        var scale = d3.scale.threshold().domain(domain).range(range);
        return function(d) {
            return scale(baseValFn(d));
        };
    }
};

var categorialFacetValueFn = function (facet) {

    // get base value function
    var baseValFn = facetBaseValueFn(facet);

    // Map categories to a set of user defined categories 
    return function (d) {
        var hay = baseValFn(d);

        // default to the raw value
        var val = hay;

        // Parse facet.categories to match against category_regexp to find group
        facet.categories.some(function (cat) {
            if(cat.category_regexp.test(hay)) {
                val = cat.group;
                return true;
            }
            else {
                return false;
            }
        });
        return val;
    };
};

var timeFacetValueFn = function (facet) {

    // get base value function
    var baseValFn = facetBaseValueFn(facet);

    
    return function (d) {
        var raw = baseValFn(d);
        if (facet.isInputDatetime) {
            return moment(raw);
        }
        else if (facet.isInputDuration) {
            return moment.duration(raw);
        }
    };
};

// Create a function that returns the transformed value for this facet
var facetValueFn = function (facet) {

    if (facet.isContinuous) 
        return continuousFacetValueFn(facet);

    else if (facet.isCategorial) 
        return categorialFacetValueFn(facet);

    else if (facet.isTime) 
        return timeFacetValueFn(facet);

    else {
        console.log( "facetValueFn not implemented for facet type: ", facet );
        return null;
    }
}; 



var continuousGroupFn = function (facet) {
    var range = [];
    var domain = [];
    var scale;
    var bin, x0, x1, size;

    var param = facet.grouping_continuous_bins;

    // A fixed number of equally sized bins, labeled by center value
    // param: number of bins
    if(facet.groupFixedN) {
        param = param < 0 ? -param : param;

        x0 = facet.minval;
        x1 = facet.maxval;
        size = (x1 - x0) / param;

        // Smaller than x0
        range.push(util.misval);

        bin = 0;
        while(bin < param) {
            domain.push(x0 + bin*size);
            range.push(x0 + (bin+0.5) * size);
            bin=bin+1;
        }

        // Larger than x1
        range.push(util.misval);
        domain.push(x1);

        scale = d3.scale .threshold() .domain(domain) .range(range);
    }

    // A fixed bin size, labeled by center value
    // param: bin size
    else if (facet.groupFixedS) {
        param = param < 0 ? -param : param;

        bin = Math.floor(facet.minval/param);
        while(bin * param < facet.maxval) {
            domain.push(bin*param);
            range.push((bin+0.5) * param);
            bin=bin+1;
        }
        domain.push(bin*param);
        scale = d3.scale .threshold() .domain(domain) .range(range);
    }

    // A fixed bin size, centered on 0, labeled by center value
    // param: bin size
    else if (facet.groupFixedSC) {
        param = param < 0 ? -param : param;

        bin = Math.floor(facet.minval/param);
        while( bin * param < facet.maxval) {
            domain.push((bin-0.5)*param);
            range.push(bin*param);
            bin=bin+1;
        }
        domain.push(bin*param);
        scale = d3.scale .threshold() .domain(domain) .range(range);
    }


    // Logarithmically (base 10) sized bins, labeled by higher value
    // param: number of bins
    else if (facet.groupLog) {
        param = param <= 0 ? 1.0 : param;

        x0 = Math.floor(Math.log(facet.minval)/Math.log(10.0));
        x1 = Math.ceil(Math.log(facet.maxval)/Math.log(10.0));
        size = (x1 - x0) / param;

        bin = 0;
        while(bin < param) {
            domain.push(Math.exp((x0 + bin*size) * Math.log(10.0)));
            range.push (Math.exp((x0 + (bin+0.5) * size) * Math.log(10.0)));
            bin=bin+1;
        }
        domain.push(Math.exp(x1 * Math.log(10.0)));
        scale = d3.scale .threshold() .domain(domain) .range(range);
    }
    else {
        console.log( "Grouping not implemented for facet", facet);
    }

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
    else {
        console.log("Group function not implemented for facet", facet);
    }
};


module.exports = AmpersandModel.extend({
    props: {
        id: ['string', true, ''],
        show: [ 'boolean', false, true ],
        active: [ 'boolean', false, false ],

        // general facet properties
        description: ['string', true, ''], // data-hook: general-description-input
        units: ['string', true, ''],       // data-hook: general-units-input
        name: ['string', true, ''],        // data-hook: general-title-input

        // properties for type
        type: {type:'string', required: true, default: 'continuous', values: ['continuous', 'categorial', 'spatial', 'time', 'network']},

        // properties for base-value-general
        accessor: ['string','true',''], // property or mathjs string
        bccessor: ['string','true',''], // property or mathjs string
        misval_astext: ['string', true, 'Infinity'],
        kind: {type:'string', required:true, default: 'property', values: ['property', 'math']},

        // properties for base-value-time
        base_value_time_format:    ['string', false, ''], // passed to momentjs
        base_value_time_zone:      ['string', false, ''], // passed to momentjs
        base_value_time_type:      {type: 'string', required: true, default: 'datetime', values: ['datetime', 'duration']},
        base_value_time_reference: ['string',false, ''], // passed to momentjs

        // properties for transform
        transform:  {type:'string', required: true, default: 'none', values: [
            'none',
            'percentiles', 'exceedences',           // continuous 
            'timezone', 'todatetime', 'toduration'  // time
        ]},

        // properties for transform-categorial

        // categoryItemCollection containing regular expressions for the mapping of facetValue to category
        categories: ['any', true, function() {return new categoryItemCollection();}],

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
        grouping_time_format: ['string',false,''], // passed to momentjs

        // properties for reduction
        reduction: {type:'string', required: true, default: 'count', values: ['count', 'sum', 'average']},
        reduction_type: {type:'string', required: true, default: 'absolute', values: ['absolute', 'percentage']},
    },

    derived: {

        // properties for: type
        isContinuous: {
            deps: ['type'],
            fn: function () {
                return this.type == 'continuous';
            }
        },
        isCategorial: {
            deps: ['type'],
            fn: function () {
                return this.type == 'categorial';
            }
        },
        isSpatial: {
            deps: ['type'],
            fn: function () {
                return this.type == 'spatial';
            }
        },
        isTime: {
            deps: ['type'],
            fn: function () {
                return this.type == 'time';
            }
        },
        isNetwork: {
            deps: ['type'],
            fn: function () {
                return this.type == 'network';
            }
        },


        // determine actual type from type + transform
        displayType: {
            deps: ['type','transform','base_value_time_type'],
            fn: function () {

                if(this.type == 'continuous') {
                    if(this.transform == 'percentiles') {
                        return 'categorial';
                    }
                }
                if(this.type == 'time') {
                    if(this.base_value_time_type == 'datetime' && this.transform == 'toduration') {
                        return 'continuous';
                    }
                    if(this.base_value_time_type == 'duration' && this.transform == 'none') {
                        return 'continuous';
                    }
                }

                return this.type;
            }
        },
        displayContinuous: {
            deps: ['displayType'],
            fn: function () {
                return this.displayType == 'continuous';
            }
        },
        displayCategorial: {
            deps: ['displayType'],
            fn: function () {
                return this.displayType == 'categorial';
            }
        },
        displaySpatial: {
            deps: ['displayType'],
            fn: function () {
                return this.displayType == 'spatial';
            }
        },
        displayTime: {
            deps: ['displayType'],
            fn: function () {
                return this.displayType == 'time';
            }
        },
        displayNetwork: {
            deps: ['displayType'],
            fn: function () {
                return this.displayType == 'network';
            }
        },

        // properties for: base-value
        misval: {
            deps: ['misval_astext'],
            fn: function () {
                var r = new RegExp(',\s*');
                return this.misval_astext.split(r);
            }
        },
        isProperty: {
            deps: ['kind'],
            fn: function () {
                return this.kind == 'property';
            },
        },
        isMath: {
            deps: ['kind'],
            fn: function () {
                return this.kind == 'math';
            },
        },

        // properties for: base-value-time
        isDatetimeInput: {
            deps: ['base_value_time_type'],
            fn: function () {
                return this.base_value_time_type == 'datetime';
            },
        },
        isDurationInput: {
            deps: ['base_value_time_type'],
            fn: function () {
                return this.base_value_time_type == 'duration';
            },
        },

        // properties for: transform-continuous
        transformNone: {
            deps: ['transform'],
            fn: function () {
                return this.transform == 'none';
            },
        },
        transformPercentiles: {
            deps: ['transform'],
            fn: function () {
                return this.transform == 'percentiles';
            },
        },
        transformExceedences: {
            deps: ['transform'],
            fn: function () {
                return this.transform== 'exceedences';
            },
        },

        // properties for: transform-time
        transformTimezone: {
            deps: ['transform'],
            fn: function () {
                return this.transform == 'timezone';
            },
        },
        transformToDatetime: {
            deps: ['transform'],
            fn: function () {
                return this.transform == 'todatetime';
            },
        },
        transformToDuration: {
            deps: ['transform'],
            fn: function () {
                return this.transform == 'toduration';
            },
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

        editURL: {
            deps: ['id'],
            fn: function () {
                return '/facets/' + this.id;
            }
        },
        value: {
            deps: ['type', 'accessor', 'misval'],
            fn: function () {
                return facetValueFn(this);
            },
            cache: false,
        },
        basevalue: {
            deps: ['type','accessor'],
            fn: function () {
                return facetBaseValueFn(this);
            },
            cache: false,
        },
        group: {
            deps: [ 'group_param', 'type', 'kind', 'grouping'],
            fn: function () {
                return facetGroupFn(this);
            },
            cache: false,
        },
        x: {
            deps: ['minval','maxval','group_param','type','kind','grouping'],
            fn: function () {
                return xFn(this);
            },
            cache: false,
        },
        xUnits: {
            deps: ['type','kind','grouping'],
            fn: function () {
                return xUnitsFn(this);
            },
            cache: false,
        },
    },
});
