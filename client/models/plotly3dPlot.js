var Chart = require('./chart');

module.exports = Chart.extend({
  initialize: function () {
    this.minPartitions = 3;
    this.maxPartitions = 3;
  },
  plotlyConfig: function () {
    return {
      options: {
        displayModeBar: true,
        showLink: false,
        displaylogo: false,
        scrollZoom: false
      },
      marker: {
        size: 12,
        line: { color: 'rgba(217, 217, 217, 0.14)', width: 0.5},
        opacity: 0.8},
      data: {
        x: [],
        y: [],
        z: [],
        type: 'scatter3d',
        mode: 'markers'
      },
      labels: {
        labelX: [],
        labelY: [],
        labelZ: []
      }
    };
  },
  plotLayout: function () {
    return {
      layout: {
        hovermode: 'closest',
        autosize: false,
        width: 500,
        height: 500,
        margin: {
          l: 50,
          r: 50,
          b: 100,
          t: 100,
          pad: 4
        },
        plot_bgcolor: '#c7c7c7'
      }
    };
  }

});
