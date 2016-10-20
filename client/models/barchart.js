/*
 * Barchart class
 *
 * Extends the Chart base class, and adds configuration.
 *
 */
var Chart = require('./chart');

module.exports = Chart.extend({
  chartjsConfig: function () {
    return {
      type: 'bar',
      data: {
        datasets: [],
        labels: []
      },
      options: {
        scales: {
          xAxes: [{
            stacked: true,
            position: 'bottom'
          }],
          yAxes: [{
            stacked: true,
            position: 'left'
          }]
        },
        tooltips: {
        }
      }
    };
  }
});
