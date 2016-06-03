var AmpersandModel = require('ampersand-model');
var CrossfilterDataset = require('./dataset-crossfilter');
var Widgets = require('./widget-collection');

module.exports = AmpersandModel.extend({
  type: 'user',
  props: {
    anim_speed: ['number', true, 500], // Global value for animation speed (0 == off)
    dataURL: ['string', true, ''],
    dataset: ['any', false, function () {
      return new CrossfilterDataset();
    }]
  },
  collections: {
    widgets: Widgets,
    bookmarked: Widgets
  }
});
