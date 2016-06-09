/**
 * Radarchart widget
 *
 * @class Radarchart
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
   * @memberof! Radarchart
   */
  chartjsConfig: function () {
    return {
      type: 'radar',
      data: {
        datasets: [],
        labels: []
      },
      options: {
        responsive: true,
        tooltips: {
        }
      }
    };
  }
});
