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

var enableFilter = function (id) {
    var f = window.app.filters.get(id);

    // FIXME: data keys are assumed to be lower case, but this is not checked/ensured
    var id_lower = id.toLowerCase();

    f._dx = window.app.crossfilter.dimension( function(d) {return validateFloat(d[id_lower]);});
    f.active = true;
};

var disableFilter = function (id) {
    var f = window.app.filters.get(id);

    f._dx.dispose();
    delete f._dx;

    f.active = false;
};

module.exports = {
    validateFloat: validateFloat,
    enableFilter: enableFilter,
    disableFilter: disableFilter,
};
