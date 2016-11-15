var BaseChart = require('./base-chart');

module.exports = BaseChart.extend({
  chartjsConfig: function () {
    return {
      type: 'line',
      data: {
        datasets: [],
        labels: []
      },
      options: {
        title: {
          display: true,
          position: 'top'
        },
        scales: {
          xAxes: [{
            type: 'linear',
            position: 'bottom',
            scaleLabel: {
              display: true
            }
          }]
        },
        tooltips: {
        }
      }
    };
  }
});
