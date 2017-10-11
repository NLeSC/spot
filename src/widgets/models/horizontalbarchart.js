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
    this.slots.reset([
      {
        description: 'Group by',
        type: 'partition',
        rank: 1,
        required: true,
        supportedFacets: ['categorial', 'datetime', 'duration', 'continuous', 'text']
      },
      {
        description: 'Subdivide by',
        type: 'partition',
        rank: 2,
        required: false,
        supportedFacets: ['categorial', 'datetime', 'duration', 'continuous', 'text']
      },
      {
        description: 'Bar height',
        type: 'aggregate',
        rank: 1,
        required: false,
        supportedFacets: ['continuous', 'duration']
      },
      {
        description: 'Error bar',
        type: 'aggregate',
        rank: 2,
        required: false,
        supportedFacets: ['continuous', 'duration']
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
