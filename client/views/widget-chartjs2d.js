var ContentView = require('./widget-content');
var templates = require('../templates');
var Chart = require('chart.js');

function destroyChart (view) {
  if (view._chartjs) {
    view._chartjs.destroy();
    delete view._chartjs;
  }

  delete view._config;
}

function initChart (view) {
  // Configure plot
  view._config = view.model.chartjsConfig();

  // Configure axis
  if (view.model.primary) {
    if (view.model.primary.groupLog || view.model.primary.transformExceedances) {
      view._config.options.scales.xAxes[0].type = 'logarithmic';
    } else {
      view._config.options.scales.xAxes[0].type = 'linear';
    }
  }
  if (view.model.secondary) {
    if (view.model.secondary.groupLog || view.model.secondary.transformExceedances) {
      view._config.options.scales.yAxes[0].type = 'logarithmic';
    } else {
      view._config.options.scales.yAxes[0].type = 'linear';
    }
  }

  // Create Chartjs object
  view._chartjs = new Chart(view.queryByHook('chart-area').getContext('2d'), view._config);

  // In callbacks on the chart we will need the view, so store a reference
  view._chartjs._Ampersandview = view;
}

function updateBubbles (view) {
  var model = view.model;
  var chartData = view._config.data;

  var xbins = model.primary.bins;
  var ybins = model.secondary.bins;

  // create lookup hashes
  var AtoI = {};
  var BtoJ = {};

  xbins.forEach(function (xbin, i) {
    AtoI[xbin.label] = i;
  });
  ybins.forEach(function (ybin, j) {
    BtoJ[ybin.label] = j;
  });

  // Define data structure for chartjs.
  // Try to keep as much of the existing structure as possbile to prevent excessive animations
  chartData.datasets[0] = chartData.datasets[0] || {};
  chartData.datasets[0].data = chartData.datasets[0].data || [{}];

  // add data
  var d = 0;
  model.data.forEach(function (group) {
    if (AtoI.hasOwnProperty(group.a) && BtoJ.hasOwnProperty(group.b)) {
      var val = parseInt(group.c) || 0;
      if (val > 0) {
        var i = AtoI[group.a];
        var j = BtoJ[group.b];

        chartData.datasets[0].data[d] = chartData.datasets[0].data[d] || {};
        chartData.datasets[0].data[d].x = xbins[i].value;
        chartData.datasets[0].data[d].y = ybins[j].value;
        chartData.datasets[0].data[d].r = val;
        d++;
      }
    }
  });

  // remove remaining (unused) points
  var cut = chartData.datasets[0].data.length - d;
  if (cut > 0) {
    chartData.datasets[0].data.splice(d, cut);
  }
}

module.exports = ContentView.extend({
  template: templates.includes.widgetcontent,
  renderContent: function () {
    // add a default chart to the view
    initChart(this);

    // redraw when the model indicates new data is available
    this.model.on('newdata', function () {
      this.update();
    }, this);

    // reset the plot when the facets change
    this.model.on('updatefacets', function () {
      destroyChart(this);
      initChart(this);
      this.update();
    }, this);

    this.model.setFilter();
  },

  update: function () {
    if (this.model.primary && this.model.secondary) {
      updateBubbles(this);
    }
    // Hand over to Chartjs for actual plotting
    this._chartjs.update();
  }
});
