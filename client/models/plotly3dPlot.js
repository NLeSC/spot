var Chart = require('./chart');

module.exports = Chart.extend({
  initialize: function () {
    this.minPartitions = 3;
    this.maxPartitions = 3;
  },
  plotlyConfig: function () {
    return {
      options: {
        displayModeBar: false,
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
      labels: {
        labelX: [],
        labelY: [],
        labelZ: []
      },
      layout: {
        hovermode: 'closest',
        autosize: true,
        width: 400,
        height: 400,
        margin: {
          l: 5,
          r: 5,
          b: 5,
          t: 5,
          pad: 0
        },
        paper_bgcolor: '#ffffff',
        plot_bgcolor: '#ffffff'
      }
    };
  }

});
