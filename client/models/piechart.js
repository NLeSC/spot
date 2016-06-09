/**
 * Piechart widget
 *
 * @class Piechart
 * @extends Widget
 */
var Widget = require('./widget');

module.exports = Widget.extend({
  props: {
    hasSecondary: ['boolean', false, false],
    hasTertiary: ['boolean', true, true]
  },

  /**
   * Returns a new ChartJS config object
   * @memberof! Piechart
   */
  chartjsConfig: function () {
    return {
      type: 'pie',
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
