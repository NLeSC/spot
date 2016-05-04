var Collection = require('ampersand-collection');
var SqlFacet = require('./facet-sql');
var app = require('ampersand-app');

// ********************************************************
// Dataset utility functions
// ********************************************************

// Draw a sample, and call a function with the sample as argument
var sampleData = function (count, cb) {
    var socket = app.socket;

    console.log('spot-server: sampleData');
    socket.emit('sampleData', count);

    socket.once('sampleData', function (data) {
        console.log('spot-server: receiving sampleData');
        cb(data); 
    });
};

var scanData = function (dataset) {
    var socket = app.socket;

    console.log('spot-server: scanData');
    socket.emit('scanData');
};


// ********************************************************
// Data callback function
// ********************************************************

// General crosfilter function, takes three factes, and returns:
// { data: function () ->
//  [{
//      A: facetA.group(d),
//      B: facetB.group(d),
//      C: reduce( facetC )
//  },...]
//  dimension: crossfilter.dimension()
// }

var initFilter = function (facetA, facetB, facetC) {
};

var releaseFilter = function (handle) {
};

var setFilter = function (handle) {
};

module.exports = Collection.extend({
    model: SqlFacet,
    comparator: function (left, right) {
        return left.name.localeCompare(right.name);
    },

    initFilter: initFilter,
    releaseFilter: releaseFilter,
    setFilter: setFilter,
    sampleData: sampleData,
    scanData: function () {scanData(this);},
});
