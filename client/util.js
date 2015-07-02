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

module.exports = { validateFloat: validateFloat };
