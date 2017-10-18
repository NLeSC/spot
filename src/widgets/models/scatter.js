/**
 * @classdesc Scatter Chart class
 * @class ScatterChart
 * @augments BaseChart
 */

var BaseChart = require('./base-chart');

module.exports = BaseChart.extend({
  initialize: function () {
    this.slots.reset([
      {
        description: 'X axis',
        type: 'partition',
        rank: 1,
        required: true,
        supportedFacets: ['categorial', 'datetime', 'duration', 'continuous', 'text']
      },
      {
        description: 'Y axis',
        type: 'partition',
        rank: 2,
        required: true,
        supportedFacets: ['categorial', 'datetime', 'duration', 'continuous', 'text']
      },
      {
        description: 'Z axis',
        type: 'partition',
        rank: 3,
        required: true,
        supportedFacets: ['categorial', 'datetime', 'duration', 'continuous', 'text']
      },
      {
        description: 'Color by',
        type: 'aggregate',
        rank: 1,
        required: false,
        supportedFacets: ['continuous', 'duration']
      }
    ]);
  },
  scatterConfig: function () {
    return {
      width: '600px',
      height: '600px',
      style: 'dot-color',
      tooltip: true,
      tooltipStyle: {
        dot: {
          border: 'none',
          borderRadius: '0px'
        }
      },
      showPerspective: true,
      showGrid: true,
      showShadow: false,
      showLegend: false,
      keepAspectRatio: false,
      verticalRatio: 1
    };
  }
});
