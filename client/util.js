var dxUtil = require('./util-crossfilter');

var scanData = function () {
    var Facet = require('./models/facet');
    var data = dxUtil.sampleData(20);
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

        f = new Facet({name: name, accessor: name, type: type, description:'Automatically detected facet, please check configuration'});

        if (type == 'categorial') {
            f.categories.reset(dxUtil.getCategories(f));
        }
        else if (type == 'continuous') {
            var mmm = dxUtil.getMinMaxMissing(f);
            f.minval_astext = mmm[0];
            f.maxval_astext = mmm[1];
            f.misval_astext = mmm[2];
        }

        window.app.me.facets.add(f);
    });
};


// A dummy facet to simplify implementation
// behaves like a categorial facet
var unitFacet = {

    isUnity: true,

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
};




module.exports = {
    scanData:   scanData,
    unitFacet:  unitFacet,
};
