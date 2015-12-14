var AmpersandModel = require('ampersand-model');

var math = require('mathjs');
var d3 = require('d3');

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
    return function(start, end, domain) {
        return d3.bisect(facet.group.domain(), end) - d3.bisect(facet.group.domain(), start);
    };
};

var xFn = function (facet) {
    var scale;

    if (facet.isContinuous ) {
        if (facet.isLog) {
            scale = d3.scale.log().domain([facet.minval, facet.maxval]);
        }
        else {
            scale = d3.scale.linear().domain([facet.minval, facet.maxval]);
        }
    }
    else if (facet.isCategorial) {
        scale = d3.scale.ordinal().domain([]);
    }

    return scale;
};


var facetValueFn = function (facet) {
    var fn;

    if (facet.isInteger) {
        fn = function (d) {
            var val = facet.misval[0];
            if (d.hasOwnProperty(facet.accessor)) {
                val = parseInt(d[facet.accessor]);
                if (isNaN(val) || val == Infinity || val == -Infinity) {
                    val = facet.misval[0];
                }
            }
            return val;
        };
    }
    else if(facet.isFloat) {
        fn = function (d) {
            var val = facet.misval[0];
            if (d.hasOwnProperty(facet.accessor)) {
                val = parseFloat(d[facet.accessor]);
                if (isNaN(val) || val == Infinity || val == -Infinity) {
                    val = facet.misval[0];
                }
            }
            return val;
        };
    }
    else if(facet.isString) {
        fn = function (d) {
            var val = facet.misval[0];
            if (d.hasOwnProperty(facet.accessor)) {
                val = d[facet.accessor];
            }
            return val;
        };
    }
    else if(facet.isFormula) {
        var formula = math.compile(facet.accessor);

        fn = function (d) {
            var val = formula.eval(d);
            if (isNaN(val) || val == Infinity || val == -Infinity) {
                return facet.misval[0];
            }
            return val;
        };
    }
    return fn;
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

    // default fall-back: identity grouping
    return function (d) {return d;};
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
        misval_astext: ['string', true, '-99999'],

        kind: ['string', true, 'continuous'],  // continuous, categorial, spatial, time, network
        type: ['string',true,'float'],         // integer, string, float, formula

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

        isInteger: {
            deps: ['type'],
            fn: function () {
                return this.type == 'integer';
            }
        },
        isFloat: {
            deps: ['type'],
            fn: function () {
                return this.type == 'float';
            }
        },
        isString: {
            deps: ['type'],
            fn: function () {
                return this.type == 'string';
            }
        },
        isFormula: {
            deps: ['type'],
            fn: function () {
                return this.type == 'formula';
            }
        },

        editURL: {
            deps: ['id'],
            fn: function () {
                return '/facets/' + this.id;
            }
        },
        value: {
            deps: [ 'isInteger', 'isFloat', 'isString', 'isFormula', 'accessor', 'misval'],
            fn: function () {
                return facetValueFn(this);
            },
        },
        group: {
            deps: [ 'group_param', 'isContinuous', 'isFixedN', 'isFixedS', 'isFixedSC', 'isLog', 'isPercentile' ],
            fn: function () {
                return facetGroupFn(this);
            },
        },
        x: {
            deps: ['minval','maxval','isContinuous','isCategorial','isLog'],
            fn: function () {
                return xFn(this);
            },
        },
        xUnits: {
            deps: ['group'],
            fn: function () {
                return xUnitsFn(this);
            },
        },
    },
});
