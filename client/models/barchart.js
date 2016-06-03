var Widget = require('./widget');

module.exports = Widget.extend({
  props: {
    _has_secondary: ['boolean', true, true],
    _has_tertiary: ['boolean', true, true],
    selection: {
      type: 'array',
      required: true,
      default: function () {
        return [];
      }
    }
  },

  chartjs_config: function () {
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
