var Chart = require('./chart');
var chartZoom = require('Chart.Zoom.js');

module.exports = Chart.extend({
  props: {
    hasPrimary: ['boolean', true, true],
    hasSecondary: ['boolean', true, true],
    hasTertiary: ['boolean', true, true]
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
        },
        pan: {
          enabled: true,
          mode: 'y'
        },
        zoom: {
          enabled: true,
          mode: 'y',
          limits: {
            max: 10,
            min: 0.5
          }
        }
      }
    };
  }
});
