var Chart = require('./chart');

module.exports = Chart.extend({
  props: {
    hasPrimary: ['boolean', true, true],
    hasSecondary: ['boolean', true, true],
    hasTertiary: ['boolean', true, true]
  },

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
