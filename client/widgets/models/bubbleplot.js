var BaseChart = require('./base-chart');

function ttLabel (tooltip, data) {
  var point = data.datasets[tooltip.datasetIndex].data[tooltip.index];
  var axes = data.datasets[0].spotAxes;

  var label = [
    'x (' + axes.x + ') ' + point.a,
    'y (' + axes.y + ') ' + point.b
  ];
  if (axes.r) {
    label.push('radius (' + axes.r + ') ' + point.bb);
  }
  if (axes.c) {
    label.push('color (' + axes.c + ' ) ' + point.aa);
  }
  label.push('Number of points in bin ' + point.count);
  return label;
}

module.exports = BaseChart.extend({
  initialize: function () {
    this.minPartitions = 2;
    this.maxPartitions = 2;
    this.minAggregates = 0;
    this.maxAggregates = 4;
  },
  chartjsConfig: function () {
    return {
      type: 'bubbleError',
      data: {
        datasets: []
      },
      options: {
        title: {
          display: true,
          position: 'top'
        },
        legend: {
          display: false
        },
        scales: {
          xAxes: [{
            type: 'linear',
            position: 'bottom',
            gridLines: {
              zeroLineColor: 'rgba(0,255,0,1)'
            },
            scaleLabel: {
              display: true
            }
          }],
          yAxes: [{
            type: 'linear',
            position: 'left',
            gridLines: {
              zeroLineColor: 'rgba(0,255,0,1)'
            },
            scaleLabel: {
              display: true
            }
          }]
        },
        tooltips: {
          enabled: true,
          mode: 'single',
          callbacks: {
            label: ttLabel
          }
        },
        errorDir: 'both'
      }
    };
  }
});
