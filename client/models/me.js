var AmpersandModel = require('ampersand-model');
var CrossfilterDataset = require('./dataset-crossfilter');

module.exports = AmpersandModel.extend({
  type: 'user',
  props: {
    dataset: ['any', false, function () {
      return new CrossfilterDataset();
    }]
  }
});
