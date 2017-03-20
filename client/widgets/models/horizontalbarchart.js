/*
 * Horizontal Barchart class
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
        },
        errorDir: 'horizontal'
      }
    };
  }
});
