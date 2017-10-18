/**
 * @classdesc network chart (sigma.js)
 * @class NetworkChart
 * @augments BaseChart
 */

var BaseChart = require('./base-chart');

module.exports = BaseChart.extend({
  initialize: function () {
    this.slots.reset([
      {
        description: 'From',
        type: 'partition',
        rank: 1,
        required: true,
        supportedFacets: ['categorial', 'datetime', 'duration', 'continuous', 'text']
      },
      {
        description: 'To',
        type: 'partition',
        rank: 2,
        required: true,
        supportedFacets: ['categorial', 'datetime', 'duration', 'continuous', 'text']
      },
      {
        description: 'Relation',
        type: 'partition',
        rank: 3,
        required: false,
        supportedFacets: ['categorial', 'datetime', 'duration', 'continuous', 'text']
      }
    ]);
  },
  sigmaConfig: function () {
    return {
      drawEdges: true,
      labelSize: 'proportional'
    };
  }
});
