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
            stacked: true,
            position: 'bottom'
          }],
          yAxes: [{
            display: false,
            lineWidth: 0
          }]
        },
        tooltips: {
        }
      }
    };
  }
});
