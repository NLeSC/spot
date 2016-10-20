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
        scales: {
          xAxes: [{
            ticks: {
              beginAtZero: true
            },
            stacked: true,
            display: false
          }],
          yAxes: [{
            ticks: {
              mirror: true
            },
            gridLines: {
              display: false
            },
            scaleLabel: {
              display: false
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
