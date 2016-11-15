var BaseChart = require('./base-chart');

module.exports = BaseChart.extend({
  initialize: function () {
    this.minPartitions = 2;
    this.maxPartitions = 3;
  },
  sigmaConfig: function () {
    return {
      drawEdges: true,
      labelSize: 'proportional'
    };
  }
});
