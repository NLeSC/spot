
var scanData = function (dataset) {
    var data = dataset.sampleData(20);
    var props = Object.getOwnPropertyNames(data[10]);

    // FIXME: nested properties
    props.forEach(function(name) {
        var type = 'categorial';
        var value = data[10][name];
        var facet;

        // TODO: auto identify more types
        // types: ['continuous', 'categorial', 'time']
        if ( value == +value ) {
            type = 'continuous';
        }

        var f = dataset.add({name: name, accessor: name, type: type, description:'Automatically detected facet, please check configuration'});

        if (type == 'categorial') {
            f.categories.reset(f.getCategories);
        }
        else if (type == 'continuous') {
            var mmm = f.getMinMaxMissing;
            f.minval_astext = mmm[0];
            f.maxval_astext = mmm[1];
            f.misval_astext = mmm[2];
        }
    });
};


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
    scanData:   scanData,
    unitFacet:  unitFacet,
};
