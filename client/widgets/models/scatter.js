var BaseChart = require('./base-chart');

module.exports = BaseChart.extend({
  initialize: function () {
    this.minPartitions = 3;
    this.maxPartitions = 3;

    this.slots.reset([
      {
        description: 'X axis',
        type: 'partition',
        rank: 1,
        required: true
      },
      {
        description: 'Y axis',
        type: 'partition',
        rank: 2,
        required: true
      },
      {
        description: 'Z axis',
        type: 'partition',
        rank: 3,
        required: true
      },
      {
        description: 'Color by',
        type: 'aggregate',
        rank: 1,
        required: false
      }
    ]);
  },
  scatterConfig: function () {
    return {
      width: '600px',
      height: '600px',
      style: 'dot-color',
      tooltip: true,
      tooltipStyle: {
        dot: {
          border: 'none',
          borderRadius: '0px'
        }
      },
      showPerspective: true,
      showGrid: true,
      showShadow: false,
      showLegend: false,
      keepAspectRatio: false,
      verticalRatio: 1
    };
  }
});
