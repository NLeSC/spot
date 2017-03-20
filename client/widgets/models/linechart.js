var BaseChart = require('./base-chart');

module.exports = BaseChart.extend({
  initialize: function () {
    this.minPartitions = 1;
    this.maxPartitions = 2;
    this.minAggregates = 0;
    this.maxAggregates = 3;
  },
  chartjsConfig: function () {
    return {
      type: 'lineError',
      data: {
        datasets: [],
        labels: []
      },
      options: {
        title: {
          display: true,
          position: 'top'
        },
        scales: {
          xAxes: [{
            type: 'linear',
            position: 'bottom',
            scaleLabel: {
              display: true
            }
          }],
          yAxes: [
            { },
            {
              type: 'linear',
              display: false,
              position: 'left',
              id: 'selection-scale',
              ticks: { min: 0, max: 1 }
            }
          ]
        },
        tooltips: {
        },
        errorDir: 'both'
      }
    };
  }
});
