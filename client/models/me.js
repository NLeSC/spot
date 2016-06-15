var AmpersandModel = require('ampersand-model');
var CrossfilterDataset = require('./dataset-crossfilter');
var Widgets = require('./widget-collection');

module.exports = AmpersandModel.extend({
  type: 'user',
  props: {
    dataset: ['any', false, function () {
      return new CrossfilterDataset();
    }]
  },
  collections: {
    widgets: Widgets,
    bookmarked: Widgets
  }
});
