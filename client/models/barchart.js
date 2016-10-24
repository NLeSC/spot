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
        title: {
          display: true,
          position: 'top'
        },
        scales: {
          xAxes: [{
            stacked: true,
            position: 'bottom',
            scaleLabel: {
              display: true,
              labelString: ''
            }
          }],
          yAxes: [{
            stacked: true,
            position: 'left',
            scaleLabel: {
              display: true,
              labelString: ''
            }
          }]
        },
        tooltips: {
        }
      }
    };
  }
});
