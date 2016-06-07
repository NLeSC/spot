/**
 * General purpose utility functions
 * @module client/util
 */
var Facet = require('./models/facet');

var idCounter = 0;

/** Get a globally unique (wrt. a session) identifier
    @returns {integer} id */
module.exports.newId = function newId () {
  var id = idCounter++;

  return id;
};

/** A dummy facet to simplify implementation that
 *  behaves like a categorial facet
 *  @returns {Facet} a dummy facet
 */
module.exports.unitFacet = function unitFacet () {
  var facet = new Facet({
    name: 'unity',
    accessor: '1',
    type: 'categorial'
  });

  // crossfilter stubs
  facet.value = function () {
    return ['1'];
  };

  facet.group = function (d) {
    return d;
  };

  // sql stubs
  facet.field = '1';
  facet.valid = '';

  return facet;
};
