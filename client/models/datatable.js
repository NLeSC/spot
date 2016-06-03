var widgetModel = require('./widget');
var util = require('../util');

module.exports = widgetModel.extend({
  props: {
    count: ['number', true, 10],
    order: ['string', true, 'descending']
  },
  initFilter: function () {
    this._crossfilter = util.dxGlue1d(this.primary);
  }
});
