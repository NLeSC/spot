var BaseChart = require('./base-chart');

module.exports = BaseChart.extend({
  initialize: function () {
    this.minPartitions = 3;
    this.maxPartitions = 3;

    this.slots.reset([
      {
        description: 'X axis',
        type: 'partition',
        rank: 1,
        required: true
      },
      {
        description: 'Y axis',
        type: 'partition',
        rank: 2,
        required: true
      },
      {
        description: 'Z axis',
        type: 'partition',
        rank: 2,
        required: true
      }
    ]);
  },
  plotlyConfig: function () {
    return {
      options: {
        displayModeBar: true,
        showLink: false,
        displaylogo: false,
        scrollZoom: false,
        sendData: false,
        autosizable: true,
        fillFrame: true,
        modeBarButtonsToRemove: ['sendDataToCloud']
        // -    workspace = workspace,
        // -    editable = editable,
        // -    doubleClick = doubleClick,
        // -    showTips = showTips,
        // -    linkText = linkText,
        // -    plot3dPixelRatio = plot3dPixelRatio
      },
      data: {
        x: [],
        y: [],
        z: [],
        i: [],
        j: [],
        k: [],
        type: 'scatter3d',
        mode: 'markers',
        marker: {
          color: 'rgb(30,144,255)',
          symbol: 'circle',
          size: 4,
          opacity: 0.7,
          line: {color: 'rgba(217,217,217,0.14)', width: 0.5}
        }
      },
      layout: {
        scene: {
          xaxis: {},
          yaxis: {},
          zaxis: {}
        },
        hovermode: 'closest',
        autosize: true,
        margin: {
          l: 5,
          r: 5,
          b: 5,
          t: 50,
          pad: 10
        },
        paper_bgcolor: '#ffffff',
        plot_bgcolor: '#ffffff'
      }
    };
  }

});
