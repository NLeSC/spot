var Chart = require('./chart');

function ttLabel (tooltip, data) {
  var point = data.datasets[tooltip.datasetIndex].data[tooltip.index];
  var axes = data.datasets[0].spotAxes;

  var label = [
    'x (' + axes.x + ') ' + point.a,
    'y (' + axes.y + ') ' + point.b
  ];
  if (axes.r) {
    label.push('r (' + axes.r + ') ' + point.aa);
  } else {
    label.push('count ' + point.aa);
  }
  if (axes.c) {
    label.push('c (' + axes.c + ' ) ' + point.bb);
  }
  return label;
}

module.exports = Chart.extend({
  initialize: function () {
    this.minPartitions = 2;
    this.maxPartitions = 2;
    this.minAggregates = 0;
    this.maxAggregates = 2;
  },
  chartjsConfig: function () {
    return {
      type: 'bubble',
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
        }
      }
    };
  }
});
