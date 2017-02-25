/**
 * CategorialTransfrom defines a transformation on categorial and textual data,
 * and is implemented as a collection of rules.
 *
 * @class CategorialTransform
 */
var Model = require('ampersand-model');
var Collection = require('ampersand-collection');

var Rule = require('./categorial-rule');
var Rules = Collection.extend({
  model: Rule
});

/**
 * setCategories finds finds all values on an ordinal (categorial) axis.
 * Updates the categorialTransform property of the facet
 *
 * @name setCategories
 * @memberof! CategorialTransform
 * @virtual
 * @function
 */

/**
 * Apply the first applicable transformation rule.
 * When no matching rule is found, return 'Other'
 * @function
 * @memberof! CategorialTransform
 * @param {string} text
 * @returns {string} text The transformed text
 */
function transform (rules, text) {
  var i;
  for (i = 0; i < rules.length; i++) {
    var group = rules.models[i].match(text);
    if (group) {
      return group;
    }
  }
  return 'Other';
}

module.exports = Model.extend({
  props: {
    transformedType: {
      type: 'string',
      required: true,
      default: 'categorial',
      values: ['categorial']
    },
    transformedMin: {
      type: 'number',
      required: true,
      default: 0
    },
    transformedMax: {
      type: 'number',
      required: true,
      default: 100
    }
  },
  collections: {
    rules: Rules
  },
  transform: function (labels) {
    if (!this.rules) {
      return labels;
    }
    if (labels instanceof Array) {
      labels.forEach(function (label, i) {
        labels[i] = transform(this.rules, label);
      }, this);
    } else {
      labels = transform(this.rules, labels);
    }
    return labels;
  },
  reset: function () {
    this.rules.reset();
  }
});
