/**
 * General purpose utility functions
 * @module client/util
 */
var Facet = require('./models/facet');

var idCounter = 0;

/**
 * @typedef {integer} ID - a globally unique (wrt. a session) identifier
 */

/**
 * @typedef {Object} DataRecord - Tripple holding the plot data
 * @property {string} DataRecord.a Group
 * @property {string} DataRecord.b Sub-group
 * @property {string} DataRecord.c Value
 */

/**
 * @typedef {DataRecord[]} Data - Array of DataRecords
 */

/**
 * Get a new ID
 * @returns {ID} id
 */
module.exports.newId = function newId () {
  var id = idCounter++;

  return id;
};

/**
 * A dummy facet to simplify implementation that
 * behaves like a categorial facet
 * @returns {Facet} a dummy facet
 */
module.exports.unitFacet = function unitFacet () {
  var facet = new Facet({
    type: 'constant'
  });

  return facet;
};
