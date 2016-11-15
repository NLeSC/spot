/*
 * Barchart class
 *
 * Extends the Chart base class, and adds configuration.
 *
 */
var BaseChart = require('./base-chart');

module.exports = BaseChart.extend({
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
