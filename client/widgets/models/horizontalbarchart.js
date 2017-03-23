/*
 * Horizontal Barchart class
 *
 * Extends the Chart base class, and adds configuration.
 *
 */
var BaseChart = require('./base-chart');
var moment = require('moment-timezone');

module.exports = BaseChart.extend({
  initialize: function () {
    this.minPartitions = 1;
    this.maxPartitions = 2;

    this.slots.reset([
      {
        description: 'Group by',
        type: 'partition',
        rank: 1,
        required: true
      },
      {
        description: 'Subdivide by',
        type: 'partition',
        rank: 2,
        required: false
      },
      {
        description: 'Bar height',
        type: 'aggregate',
        rank: 1,
        required: false
      },
      {
        description: 'Error bar',
        type: 'aggregate',
        rank: 2,
        required: false
      }
    ]);
  },
  chartjsConfig: function () {
    return {
      type: 'horizontalBarError',
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
            ticks: {
              beginAtZero: true
            },
            stacked: true,
            display: false,
            scaleLabel: {
              display: true
            },
            time: {
              parser: function (label) {
                return moment(label, moment.ISO_8601);
              }
            }
          }],
          yAxes: [{
            ticks: {
              mirror: true
            },
            gridLines: {
              display: false
            },
            scaleLabel: {
              display: true
            },
            stacked: true,
            time: {
              parser: function (label) {
                return moment(label, moment.ISO_8601);
              }
            }
          }]
        },
        tooltips: {
        }
      }
    };
  }
});
