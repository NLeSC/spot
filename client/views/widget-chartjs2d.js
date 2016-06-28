var ContentView = require('./widget-content');
var templates = require('../templates');
var Chart = require('chart.js');

var MAX_BUBBLE_SIZE = 50;

function destroyChart (view) {
  if (view._chartjs) {
    view._chartjs.destroy();
    delete view._chartjs;
  }

  delete view._config;
}

function normalizeGroupC (data) {
  var norm;
  var min = Number.MAX_VALUE;
  var max = -min;
  data.forEach(function (group) {
    var val = parseInt(group.c) || 0;
    min = min <= val ? min : val;
    max = max >= val ? max : val;
  });
  if (min < 0) {
    min = Math.abs(min);
    max = max < min ? min : max;

    norm = function (v) {
      return Math.abs(v) / max;
    };
  } else {
    norm = function (v) {
      return v / (max - min);
    };
  }
  return norm;
}

function initChart (view) {
  var filter = view.model.filter;

  // Configure plot
  view._config = view.model.chartjsConfig();
  var options = view._config.options;

  // Configure axis
  if (filter.primary) {
    if (filter.primary.groupLog) {
      options.scales.xAxes[0].type = 'logarithmic';
    } else {
      options.scales.xAxes[0].type = 'linear';
    }
  }
  if (filter.secondary) {
    if (filter.secondary.groupLog) {
      options.scales.yAxes[0].type = 'logarithmic';
    } else {
      options.scales.yAxes[0].type = 'linear';
    }
  }

  // Create Chartjs object
  view._chartjs = new Chart(view.queryByHook('chart-area').getContext('2d'), view._config);

  // In callbacks on the chart we will need the view, so store a reference
  view._chartjs._Ampersandview = view;
}

function updateBubbles (view) {
  var filter = view.model.filter;
  var chartData = view._config.data;

  var xbins = filter.primary.bins();
  var ybins = filter.secondary.bins();

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

  var norm = normalizeGroupC(filter.data);

  // add data
  var d = 0;
  filter.data.forEach(function (group) {
    if (AtoI.hasOwnProperty(group.a) && BtoJ.hasOwnProperty(group.b)) {
      var val = parseInt(group.c) || 0;
      if (val > 0) {
        var i = AtoI[group.a];
        var j = BtoJ[group.b];

        chartData.datasets[0].data[d] = chartData.datasets[0].data[d] || {};
        chartData.datasets[0].data[d].x = xbins[i].value;
        chartData.datasets[0].data[d].y = ybins[j].value;
        chartData.datasets[0].data[d].r = norm(val) * MAX_BUBBLE_SIZE;
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
    var filter = this.model.filter;

    // add a default chart to the view
    initChart(this);

    // redraw when the model indicates new data is available
    filter.on('newdata', function () {
      this.update();
    }, this);

    // reset the plot when the facets change
    filter.on('newfacets', function () {
      destroyChart(this);
      initChart(this);
      this.update();
    }, this);
  },

  update: function () {
    var filter = this.model.filter;

    if (filter.primary && filter.secondary) {
      updateBubbles(this);
    }
    // Hand over to Chartjs for actual plotting
    this._chartjs.update();
  }
});
