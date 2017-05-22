var BaseChart = require('./base-chart');

module.exports = BaseChart.extend({
  initialize: function () {
    this.slots.reset([
      {
        description: 'From',
        type: 'partition',
        rank: 1,
        required: true
      },
      {
        description: 'To',
        type: 'partition',
        rank: 2,
        required: true
      },
      {
        description: 'Relation',
        type: 'partition',
        rank: 3,
        required: false
      }
    ]);
  },
  sigmaConfig: function () {
    return {
      drawEdges: true,
      labelSize: 'proportional'
    };
  }
});
