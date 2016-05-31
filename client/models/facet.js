var AmpersandModel = require('ampersand-model');
var categoryItemCollection = require('../models/categoryitem-collection');

var moment = require('moment-timezone');

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
            x0 = Math.log(facet.minval)/Math.log(10.0);
            x1 = Math.log(facet.maxval)/Math.log(10.0);
            size = (x1 - x0) / nbins;
        }

        var xm, xp;
        for(i=0; i<nbins; i++) {
            xm = x0 + i * size;
            xp = x0 + (i + 1) * size;
            if(facet.groupLog) {
                xm = Math.exp(xm * Math.log(10.0));
                xp = Math.exp(xp * Math.log(10.0));

                label = xp;
            }
            else {
                label = 0.5 * (xm + xp);
            }

            // print with a precission of 4 decimals
            label = label.toPrecision(4);

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


module.exports = AmpersandModel.extend({
    idAttribute: 'cid',
    dataTypes: {
        // string or number allowed, but stored as string
        stringornumber: {
            set: function (newVal) {
                try {
                    return {type: 'stringornumber', val: newVal.toString() };
                }
                catch (anyError) {
                    return {type: 'stringornumber', val: "0"};
                }
            },
            compare: function (currentVal, newVal, attributeName) {
                try {
                    return currentVal == newVal;
                }
                catch (anyError) {
                    return false;
                }
            },
        },
    },
    props: {
        show: [ 'boolean', false, true ],
        active: [ 'boolean', false, false ],
        modelType: ['string','true','generic'],

        // general facet properties
        description: ['string', true, ''], // data-hook: general-description-input
        units: ['string', true, ''],       // data-hook: general-units-input
        name: ['string', true, ''],        // data-hook: general-title-input

        // properties for type
        type: {type:'string', required: true, default: 'continuous', values: ['continuous', 'categorial', 'time']},

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
        minval_astext: 'stringornumber',
        maxval_astext: 'stringornumber',

        // properties for grouping-continuous
        grouping_continuous_bins: ['number', true, 20 ],
        grouping_continuous:      {type: 'string', required: true, default: 'fixedn', values: ['fixedn', 'fixedsc', 'fixeds', 'log']},

        // properties for grouping-time
        grouping_time_format: ['string',true,'hours'], // passed to momentjs

        // properties for reduction: should be a valid SQL aggregation function
        reduction: {type:'string', required: true, default: 'count', values: ['count', 'sum', 'avg']},
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
        isTime: {
            deps: ['type'],
            fn: function () {
                return this.type == 'time';
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
        displayTime: {
            deps: ['displayType'],
            fn: function () {
                return this.displayType == 'time';
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
                return parseFloat(this.minval_astext);
            }
        },
        maxval: {
            deps: ['maxval_astext'],
            fn: function () {
                return parseFloat(this.maxval_astext);
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
                return this.reduction == 'avg';
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
        bins: {
            fn: function () {
                return facetBinsFn(this);
            },
            cache: false,
        },
    },
});
