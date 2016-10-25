var AmpersandModel = require('ampersand-model');
var ClientDataset = require('./dataset/client');

module.exports = AmpersandModel.extend({
  type: 'user',
  props: {
    dataset: ['any', false, function () {
      return new ClientDataset();
    }]
  }
});
