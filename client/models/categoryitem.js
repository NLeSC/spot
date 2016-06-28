var AmpersandModel = require('ampersand-model');

// Data structure for working with categorial data
// it helps with mapping a dataitem (category) on a group
module.exports = AmpersandModel.extend({
  dataTypes: {
    // string or number allowed, but stored as number
    numberorstring: {
      set: function (newVal) {
        var val;
        try {
          val = parseInt(newVal);
          return {type: 'numberorstring', val: val};
        } catch (anyError) {
          throw new TypeError('Cannot make number from', newVal);
        }
      },
      compare: function (currentVal, newVal, attributeName) {
        var cv, nv;
        try {
          cv = parseInt(currentVal);
          nv = parseInt(newVal);
          return cv === nv;
        } catch (anyError) {
          return false;
        }
      }
    }
  },
  props: {
    // string format of regexp to match data against
    category: ['string', false, 'Missing'],

    // number of items in this category
    count: ['numberorstring', false, 0],

    // name of the group this is mapped to
    group: ['string', false, 'Missing']
  }
});
