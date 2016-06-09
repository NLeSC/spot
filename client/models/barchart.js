/**
 * Barchart widget
 *
 * @class Barchart
 * @extends Widget
 */
var Widget = require('./widget');

module.exports = Widget.extend({
  props: {
    hasSecondary: ['boolean', true, true],
    hasTertiary: ['boolean', true, true]
  },

  /**
   * Returns a new ChartJS config object
   * @memberof! Barchart
   */
  chartjsConfig: function () {
    return {
      type: 'bar',
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
