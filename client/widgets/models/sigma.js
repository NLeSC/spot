var Chart = require('./chart');

module.exports = Chart.extend({
  initialize: function () {
    this.minPartitions = 2;
    this.maxPartitions = 2;
  },
  sigmaConfig: function () {
    return {
      drawEdges: true,
      labelSize: 'proportional'
    };
  }
});
