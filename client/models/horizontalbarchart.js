/*
 * Horizontal Barchart class
 *
 * Extends the Chart base class, and adds configuration.
 *
 */
var Chart = require('./chart');

module.exports = Chart.extend({
  props: {
    hasPrimary: ['boolean', true, true],
    hasSecondary: ['boolean', true, true],
    hasTertiary: ['boolean', true, true]
  },

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
