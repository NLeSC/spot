var math = require('mathjs');

var validateFloat = function(val) {
    if (typeof val != 'undefined') {
        val = parseFloat(val);
        if (! isNaN(val)) { 
            if (val > -99999 ) {
                return val;
            }
        }
    }
    return Infinity;
};

var getFGrange = function (fg) {
    var t = fg.filter.top(2);
    var b = fg.filter.bottom(2);

    var max = fg.valueFn(t[0]);
    var min = fg.valueFn(b[0]);
    if(isNaN(max) || max == Infinity) {
        max = fg.valueFn(t[1]);
    }
    if(isNaN(min) || min == -Infinity) {
        min = fg.valueFn(b[1]);
    }
    return [min, max];
};

var disposeFilterAndGroup = function (fg) {
    if(! fg) {
        return;
    }
    if(fg.filter) {
        fg.filter.filterAll();
        fg.filter.dispose();
        delete fg.filter;
    }
    if(fg.group) {
        delete fg.group;
    }
    if(fg.valueFn) {
        delete fg.valueFn;
    }
};

var facetFilterAndGroup = function (id) {

    var facet = window.app.filters.get(id);
    var valueFn = facetValueFn(facet);
    var filter = window.app.crossfilter.dimension(valueFn);
    var group = filter.group();

    if (facet.isExtensive) {
        group.reduceSum(valueFn);
    }
    else {
        group.reduceCount();
    }

    return {facet: facet, filter: filter, group: group, valueFn: valueFn};
};

var facetValueFn = function (facet) {
    var fn;
    console.log(facet);

    if (facet.isInteger) {
        fn = function (d) {
            var val = Infinity;
            if (d.hasOwnProperty(facet.accessor)) {
                val = parseInt(d[facet.accessor]);
                if (isNaN(val)) {
                    val = Infinity;
                }
            }
            return val;
        };
    }
    else if(facet.isFloat) {
        fn = function (d) {
            var val = Infinity;
            if (d.hasOwnProperty(facet.accessor)) {
                val = parseFloat(d[facet.accessor]);
                if (isNaN(val)) {
                    val = Infinity;
                }
            }
            return val;
        };
    }
    else if(facet.isString) {
        fn = function (d) {
            var val = "";
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
            if (isNaN(val)) {
                return Infinity;
            }
            return val;
        };
    }
    return fn;
}; 

module.exports = {
    validateFloat: validateFloat,
    facetValueFn: facetValueFn,
    getFGrange: getFGrange,
    facetFilterAndGroup: facetFilterAndGroup,
    disposeFilterAndGroup: disposeFilterAndGroup,
};
