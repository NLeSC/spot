/**
 * ChartJS widget
 *
 * Extends the Widget base class, and adds configuration.
 * Implementations for barchart, linechart, piechart, polarareachart, and radarchart are implemented.
 *
 * @interface ChartJS-charts
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
   * @memberof! ChartJS-charts
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
