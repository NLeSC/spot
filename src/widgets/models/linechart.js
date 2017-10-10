var BaseChart = require('./base-chart');
var moment = require('moment-timezone');

module.exports = BaseChart.extend({
  initialize: function () {
    this.slots.reset([
      {
        description: 'X axis',
        type: 'partition',
        rank: 1,
        required: true,
        supportedFacets: ['categorial', 'datetime', 'duration', 'continuous', 'text']
      },
      {
        description: 'Group by',
        type: 'partition',
        rank: 2,
        required: false,
        supportedFacets: ['categorial', 'datetime', 'duration', 'continuous', 'text']
      },
      {
        description: 'Y axis',
        type: 'aggregate',
        rank: 1,
        required: false,
        supportedFacets: ['continuous', 'duration']
      },
      {
        description: 'X error',
        type: 'aggregate',
        rank: 2,
        required: false,
        supportedFacets: ['continuous', 'duration']
      },
      {
        description: 'Y error',
        type: 'aggregate',
        rank: 3,
        required: false,
        supportedFacets: ['continuous', 'duration']
      },
      {
        description: 'Second Y axis',
        type: 'aggregate',
        rank: 4,
        required: false,
        supportedFacets: ['continuous', 'duration']
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
              position: 'right',
              id: 'second-scale'
            },
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
