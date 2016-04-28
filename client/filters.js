var util = require('./util');
var misval = require('./misval');

var categorial1DHandler = function (filters, group, categories) {
 
    // A) none selected:
    //   -> add
    // B) one selected: 
    //   a) same one clicked:
    //   -> invert selection
    //   b) different one clicked:
    //   -> add
    // C) more selected:
    //   a) same one clicked:
    //   -> remove
    //   b) different one clicked:
    //   -> add

    // after add: if filters == categories, reset and dont filter
    var i = filters.indexOf(group); 

    if(filters.length != 1) {
        if(i > -1) {
            filters.splice(i,1);
            return;
        }
    }
    else {
        if(i > -1) {
            filters.splice(0,filters.length);
            categories.forEach(function (f) {
                if (f.group!=group) {
                    filters.push(f.group);
                }
            });
            return;
        }
    }
    // Add
    filters.push(group);

    // allow all => filter none
    if(filters.length === categories.length) {
        filters.splice(0,filters.length);
    }
};

var continuous1DHandler = function (filters, group, domain, options) {
    options = options || {log: false};

    if (filters.length == 0) {
        filters[0] = group[0];
        filters[1] = group[1];
    }
    // clicked outside range
    else if (group[0] >= filters[1]) {
        filters[1] = group[1];
    }
    else if (group[1] <= filters[0]) {
        filters[0] = group[0];
    }
    // clicked inside range
    else {
        var d1, d2;
        if (options.log) {
            d1 = Math.abs(Math.log(filters[0]) - Math.log(group[0]));
            d2 = Math.abs(Math.log(filters[1]) - Math.log(group[1]));
        }
        else {
            d1 = Math.abs(filters[0] - group[0]);
            d2 = Math.abs(filters[1] - group[1]);
        }
        if (d1 < d2) {
            filters[0] = group[0];
        }
        else {
            filters[1] = group[1];
        }
    }
};

var categorial1D = function (widget) {
    var dimension = widget._crossfilter.dimension;

    dimension.filter(null);

    // Set of selected values
    var selection = widget.selection;

    if (selection.length == 0) {
        widget._crossfilter.filterFunction = function (d) {
            return true;
        };
    }
    else {
        var haystack = {};
        selection.forEach(function (h) {
            haystack[h] = true;
        });
        
        widget._crossfilter.filterFunction = function (d) {
            var needle = d;
            if(! (needle instanceof Array)) {
                needle = [d];
            } 

            var selected = false;
            needle.forEach(function (s) {
                selected = selected | haystack[s];
            });
            return selected;
        };
        dimension.filterFunction(widget._crossfilter.filterFunction);
    }
};

// return true if domain[0] <= d <= domain[1]
var continuous1D = function (widget) {
    var dimension = widget._crossfilter.dimension;

    dimension.filter(null);

    var min = widget.selection[0];
    var max = widget.selection[1];

    // dont filter when the filter is incomplete / malformed
    if (min == misval || max == misval || min == max) {
        widget._crossfilter.filterFunction = function (d) {
            return true;
        };
        return;
    }

    if(min > max) {
        var swap = min;
        min = max;
        max = swap;
    }

    widget._crossfilter.filterFunction = function (d) {
        return (d >= min && d <= max && d != misval);
    };

    dimension.filterFunction(widget._crossfilter.filterFunction);
};

var isSelected = function(widget, d) {
    if(widget && widget._crossfilter && widget._crossfilter.filterFunction) {
        return widget._crossfilter.filterFunction(d);
    }
    return true;
};


module.exports = {
    categorial1D: categorial1D,
    continuous1D: continuous1D,
    categorial1DHandler: categorial1DHandler,
    continuous1DHandler: continuous1DHandler,
    isSelected: isSelected,
};

