/**
 * @classdesc pie chart class
 * @class PieChart
 * @augments BaseChart
 */

var BaseChart = require('./base-chart');

module.exports = BaseChart.extend({
  initialize: function () {
    this.slots.reset([
      {
        description: 'Group by',
        type: 'partition',
        rank: 1,
        required: true,
        supportedFacets: ['categorial', 'datetime', 'duration', 'continuous', 'text']
      },
      {
        description: 'Pie size',
        type: 'aggregate',
        rank: 1,
        required: false,
        supportedFacets: ['continuous', 'duration']
      }
    ]);
  },
  chartjsConfig: function () {
    return {
      type: 'pie',
      data: {
        datasets: [],
        labels: []
      },
      options: {
        title: {
          display: true,
          position: 'top'
        },
        tooltips: {
        }
      }
    };
  }
});
