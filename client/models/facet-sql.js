var Facet = require('./facet');
var squel = require('squel').useFlavour('postgres');
var misval = require('../misval');

function facetSelectValid (facet) {
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

function facetQuery (facet) {
  // bins := {
  //    label: <string>                          text for display
  //    group: <string> || [<number>, <number>]  domain of this grouping
  //    value: <string> || <number>              a value guaranteed to be in this group
  // }
  var accessor = facet.accessor;
  var bins = facet.bins;
  var query = squel.case();

  bins.forEach(function (bin, i) {
    var b = squel.expr();
    if (facet.displayContinuous) {
      if (i === bins.length - 1) {
        // Assign maximum value to the last bin
        b
          .and(accessor + '>=' + bin.group[0])
          .and(accessor + '<=' + bin.group[1]);
      } else {
        // Assign lower limit of interval to the bin
        b
          .and(accessor + '>=' + bin.group[0])
          .and(accessor + '<' + bin.group[1]);
      }
    } else if (facet.displayCategorial) {
      b
        .and(accessor + '=' + bin.group[0]);
    }
    query
      .when(b.toString())
      .then(bin.label);
  });

  if (facet.displayContinuous) {
    var last = bins.length - 1;
    query.when(accessor + '=' + bins[last].group[1]).then(bins[last].label);
  }

  // Return missing value in all other cases
  query.else(misval);

  return query;
}

module.exports = Facet.extend({
  props: {
    modelType: ['string', 'true', 'sql'],
    misvalAsText: ['string', true, 'null']
  },
  derived: {
    // Private methods for sql facets
    field: {
      fn: function () {
        return facetQuery(this);
      },
      cache: false
    },
    valid: {
      fn: function () {
        return facetSelectValid(this);
      },
      cache: false
    }
  }
});
