/**
 * Utility functions for SQL datasets for use on the server
 *
 * Approach:
 * 1. The dataset, including Facets and Filters, is kept in sync with the client (website) using the 'sync-facet' requests
 * 2. An SQL view is created holding the transformed values of all active facets
 * 3. On a 'newdata-<id>' request, construct a query using the relevant `Facet.groups`
 * 4, Execute the query, and send back the results
 *
 * @module client/util-sql
 */
var squel = require('squel').useFlavour('postgres');
// var misval = require('./misval');

function selectValid (facet) {
  var accessor = facet.accessor;
  var query = squel.expr();

  facet.misval.forEach(function (val) {
    if (val === null) {
      query.and(accessor + ' IS NOT NULL'); // FIXME document
    } else {
      if (facet.isCategorial) { // String valued facet
        query.and(accessor + " != '" + val + "'");
      } else if (facet.isContinuous) { // Number valued facet
        if (val && val === +val) {
          query.and(accessor + ' != ' + val);
        }
      }
    }
  });
  return query;
}

/*
 * Create the SQL query part for a Continuous facet
 * @function
 * @params {Facet} facet an isContinuous facet
 * @returns {string} query
 */
function facetContinuousQuery (facet) {
  // TODO: Use width_bucket for Postgresql 9.5 or later
  // From the docs: return the bucket number to which operand would be assigned given an array listing
  // the lower bounds of the buckets; returns 0 for an input less than the first lower bound;
  // the thresholds array must be sorted, smallest first, or unexpected results will be obtained

  var lowerbounds = [];
  // check for continuousTransforms
  if (facet.continuousTransform.length > 0) {
    // TODO
    console.warn('continuousTransforms not implemented yet');
    lowerbounds = [];
  } else {
    facet.groups.forEach(function (group, i) {
      lowerbounds[i] = group.min;
      lowerbounds[i + 1] = group.max;
    });
  }

  var accessor = facet.accessor;
  var query = squel.case();
  var b;

  var i;
  for (i = 0; i < lowerbounds.length - 1; i++) {
    b = squel.expr();
    b.and(accessor + '>' + lowerbounds[i]).and(accessor + '<=' + lowerbounds[i + 1]);
    query.when(b.toString()).then(i + 1);
  }
  query.else(lowerbounds.length);
  return query;
  // TODO: returns group index instead of group label
}

function facetCategorialQuery (facet) {
}

function facetTimeOrDurationQuery (facet) {
}

/**
 * Create the SQL query part for a facet
 * @function
 * @params {Facet} facet
 * @returns {string} query
 */
function facetQuery (facet) {
  if (facet.isContinuous) {
    return facetContinuousQuery(facet);
  } else if (facet.isCategorial) {
    return facetCategorialQuery(facet);
  } else if (facet.isTimeOrDuration) {
    return facetTimeOrDurationQuery(facet);
  }
  return '1'; // default to the first group
}

module.exports = {
  selectValid: selectValid,
  facetQuery: facetQuery
};
