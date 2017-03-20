/*
 * Barchart class
 *
 * Extends the Chart base class, and adds configuration.
 *
 */
var BaseChart = require('./base-chart');

module.exports = BaseChart.extend({
  initialize: function () {
    this.minPartitions = 1;
    this.maxPartitions = 2;
    this.minAggregates = 0;
    this.maxAggregates = 2;
  },
  chartjsConfig: function () {
    return {
      type: 'barError',
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
        },
        errorDir: 'vertical',
        errorCapWidth: 0.25
      }
    };
  }
});
