var AmpersandModel = require('ampersand-model');
var categoryItemCollection = require('../models/categoryitem-collection');

var math = require('mathjs');
var d3 = require('d3');
var dc = require('dc');

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
    if (facet.isContinuous) {
        return function(start, end, domain) {
            return d3.bisect(facet.group.domain(), end) - d3.bisect(facet.group.domain(), start);
        };
    }
    else if (facet.isCategorial) {
        return dc.units.ordinal;
    }
};

var xFn = function (facet) {
    var scale;

    if (facet.isContinuous) {
        if (facet.isLog) {
            scale = d3.scale.log().domain([facet.minval, facet.maxval]);
        }
        else {
            scale = d3.scale.linear().domain([facet.minval, facet.maxval]);
        }
    }
    else if (facet.isCategorial) {

        var domain = [];

        facet.categories.forEach(function(cat) {
            domain.push(cat.group);
        }); 
        domain.sort();

        scale = d3.scale.ordinal().domain(domain);
    }

    return scale;
};

// Base value for given facet
var facetBaseValueFn = function (facet) {

    if(facet.isSimple) {
        return function (d) {
            var val = facet.misval[0];
            if (d.hasOwnProperty(facet.accessor)) {
                val = d[facet.accessor];
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
};

// Transformed / mapped value for this facet
var facetValueFn = function (facet) {

    // get base value
    var baseValFn = facetBaseValueFn(facet);

    // Apply transformation:

    // Map categories to a set of user defined categories 
    if (facet.isCategorial) {
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
    }

    // Parse numeric value from base value
    else if (facet.isContinuous) {
        return function (d) {
            var val = parseFloat(baseValFn(d));
            if (isNaN(val) || val == Infinity || val == -Infinity) {
                return facet.misval[0];
            }
            return val;
        };
    }

    // Default: no transformation, use base value
    return baseValFn;
}; 


var facetGroupFn = function (facet) {

    var range = [];
    var domain = [];
    var scale;
    var bin, x0, x1, size;

    var param = facet.group_param;

    if(facet.isContinuous) {

        // A fixed number of equally sized bins, labeled by center value
        // param: number of bins
        if(facet.isFixedN) {
            param = param < 0 ? -param : param;

            x0 = facet.minval;
            x1 = facet.maxval;
            size = (x1 - x0) / param;

            // Smaller than x0
            range.push(facet.misval[0]);

            bin = 0;
            while(bin < param) {
                domain.push(x0 + bin*size);
                range.push(x0 + (bin+0.5) * size);
                bin=bin+1;
            }

            // Larger than x1
            range.push(facet.misval[0]);
            domain.push(x1);

            scale = d3.scale .threshold() .domain(domain) .range(range);
        }

        // A fixed bin size, labeled by center value
        // param: bin size
        else if (facet.isFixedS) {
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
        else if (facet.isFixedSC) {
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


        // Inverse logarithmically sized bins, labeled by higher value
        else if (facet.isLog) {
            param = param < 0 ? -param : param;

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

        else if (facet.isPercentile) {
        }

        return scale;
    }
    else if (facet.isCategorial) {
        // Don't do any grouping; that is done in the step from base value to value.
        // Matching of facet value and group could lead to a different ordering,
        // which is not allowed by crossfilter
        scale = function (d) {return d;};
    }

    return scale;
};












module.exports = AmpersandModel.extend({
    props: {
        id: ['string', true, ''],
        name: ['string', true, ''],
        units: ['string', true, ''],
        description: ['string', true, ''],
        accessor: ['string','true',''],       // property, index, formula

        show: [ 'boolean', false, true ],
        active: [ 'boolean', false, false ],

        group_param: [ 'number', true, 20 ],
        minval_astext: ['string', true, '0'],
        maxval_astext: ['string', true, '100'],
        misval_astext: ['string', true, 'Infinity'],

        kind: ['string', true, 'continuous'],  // continuous, categorial, spatial, time, network
        type: ['string', true, 'simple'],      // simple, math 

        // categoryItemCollection containing regular expressions for the mapping of facetValue to category
        categories: ['any', true, function() {return new categoryItemCollection();}],

        grouping: ['string', true, 'fixedn'], // fixedn, fixeds, fixedsc, log, percentile, exceedence
        reduction: ['string', true, 'count'],  // count or sum
    },
    derived: {
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
        misval: {
            deps: ['misval_astext'],
            fn: function () {
                return [parseFloat(this.misval_astext)]; // FIXME: allow comma separated lists, and use proper accessor
            }
        },
        isSimple: {
            deps: ['type'],
            fn: function () {
                return this.type == 'simple';
            },
        },
        isMath: {
            deps: ['type'],
            fn: function () {
                return this.type == 'math';
            },
        },
        isFixedN: {
            deps: ['grouping'],
            fn: function () {
                return this.grouping == 'fixedn';
            }
        },
        isFixedS: {
            deps: ['grouping'],
            fn: function () {
                return this.grouping == 'fixeds';
            }
        },
        isFixedSC: {
            deps: ['grouping'],
            fn: function () {
                return this.grouping == 'fixedsc';
            }
        },
        isLog: {
            deps: ['grouping'],
            fn: function () {
                return this.grouping == 'log';
            }
        },
        isPercentile: {
            deps: ['grouping'],
            fn: function () {
                return this.grouping == 'percentile';
            }
        },
        isExceedence: {
            deps: ['grouping'],
            fn: function () {
                return this.grouping == 'exceedence';
            }
        },
        
        isContinuous: {
            deps: ['kind'],
            fn: function () {
                return this.kind == 'continuous';
            }
        },
        isCategorial: {
            deps: ['kind'],
            fn: function () {
                return this.kind == 'categorial';
            }
        },
        isSpatial: {
            deps: ['kind'],
            fn: function () {
                return this.kind == 'spatial';
            }
        },
        isTime: {
            deps: ['kind'],
            fn: function () {
                return this.kind == 'time';
            }
        },
        isNetwork: {
            deps: ['kind'],
            fn: function () {
                return this.kind == 'network';
            }
        },

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
