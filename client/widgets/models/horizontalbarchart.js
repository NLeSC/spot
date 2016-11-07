/*
 * Horizontal Barchart class
 *
 * Extends the Chart base class, and adds configuration.
 *
 */
var Chart = require('./chart');

module.exports = Chart.extend({
  chartjsConfig: function () {
    return {
      type: 'horizontalBar',
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
            stacked: true
          }]
        },
        tooltips: {
        }
      }
    };
  }
});
