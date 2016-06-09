/**
 * Polarareachart widget
 *
 * @class Polarareachart
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
   * @memberof! Polarareachart
   */
  chartjsConfig: function () {
    return {
      type: 'polarArea',
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
