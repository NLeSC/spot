

// A dummy facet to simplify implementation
// behaves like a categorial facet
var unitFacet = {
    isContinuous: false,
    isCategorial: true,

    displayContinuous: false,
    displayCategorial: true,
    displayTime: false,

    reduceSum: false,
    reduceCount: true,
    reduceAverage: false,

    reduceAbsolute: true,
    reducePercentage: false,

    value: function () {return ["1"];},
    group: function (d) {return d;},
};




module.exports = {
    unitFacet:  unitFacet,
};
