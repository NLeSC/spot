var Chart = require('./chart');

module.exports = Chart.extend({
  chartjsConfig: function () {
    return {
      type: 'polarArea',
      data: {
        datasets: [],
        labels: []
      },
      options: {
        tooltips: {
        }
      }
    };
  }
});
