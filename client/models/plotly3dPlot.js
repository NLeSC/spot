var Chart = require('./chart');

module.exports = Chart.extend({
  initialize: function () {
    this.minPartitions = 3;
    this.maxPartitions = 3;
  },
  plotlyConfig: function () {
    return {
      options:{
        displayModeBar: false,
        showLink: false,
        displaylogo: false,
        scrollZoom: false
      },
      marker: {
  		size: 12,
  		line: {
  		color: 'rgba(217, 217, 217, 0.14)',
  		width: 0.5},
  		opacity: 0.8},
      data: {
        datasets: [],
        labels: [],
        type: 'scatter3d',
        mode: 'markers'
    }
    };
    },
    plotLayout: function () {
      return {
          layout:{
            hovermode: 'closest',
            autosize: true,
            width: 800,
            height: 800,
            margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 0
          }
        }
    };
    }


});
