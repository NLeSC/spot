var AmpersandModel = require('ampersand-model');
var ClientDataset = require('./dataset/client');
var DatasetCollection = require('./dataset/collection');

module.exports = AmpersandModel.extend({
  type: 'user',
  props: {
    dataset: ['any', false, function () {
      return new ClientDataset();
    }]
  },
  collections: {
    datasets: DatasetCollection
  }
});
