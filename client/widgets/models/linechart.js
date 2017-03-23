var BaseChart = require('./base-chart');
var moment = require('moment-timezone');

module.exports = BaseChart.extend({
  initialize: function () {
    this.minPartitions = 1;
    this.maxPartitions = 2;

    this.slots.reset([
      {
        description: 'X axis',
        type: 'partition',
        rank: 1,
        required: true
      },
      {
        description: 'Y axis',
        type: 'aggregate',
        rank: 1,
        required: false
      },
      {
        description: 'X error',
        type: 'aggregate',
        rank: 2,
        required: false
      },
      {
        description: 'Y error',
        type: 'aggregate',
        rank: 3,
        required: false
      }
    ]);
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
            },
            time: {
              parser: function (label) {
                return moment(label, moment.ISO_8601);
              }
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
        }
      }
    };
  }
});
