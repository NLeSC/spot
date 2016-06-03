var Widget = require('./widget');

module.exports = Widget.extend({
  props: {
    hasSecondary: ['boolean', true, true],
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
      type: 'line',
      data: {
        datasets: [],
        labels: []
      },
      options: {
        responsive: true,
        scales: {
          xAxes: [{}],
          yAxes: [{}]
        },
        tooltips: {
        }
      }
    };
  }
});
