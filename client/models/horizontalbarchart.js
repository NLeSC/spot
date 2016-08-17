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
        responsive: true,
        scales: {
          xAxes: [{
            ticks: {
              beginAtZero: true
            },
            stacked: true,
            display: false
          }],
          yAxes: [{
            stacked: true,
            display: false
          }]
        },
        tooltips: {
        }
      }
    };
  }
});
