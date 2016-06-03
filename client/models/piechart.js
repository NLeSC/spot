var Widget = require('./widget');

module.exports = Widget.extend({
  props: {
    hasSecondary: ['boolean', false, false],
    hasTertiary: ['boolean', true, true],
    selection: {
      type: 'array',
      required: true,
      default: function () {
        return [];
      }
    }
  },

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
