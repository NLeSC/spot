var AmpersandView = require('ampersand-view');
var Chart = require('chart.js');
var misval = require('../../../framework/util/misval.js');
var colors = require('../../colors');
var app = require('ampersand-app');

var MAX_BUBBLE_SIZE = 50;

// function destroyChart (view) {
//   // tear down existing stuff
//   if (view._chartjs) {
//     view._chartjs.destroy();
//     delete view._chartjs;
//   }
//
//   delete view._config;
// }

function normalizeGroup (data, key) {
  var norm;
  var min = Number.MAX_VALUE;
  var max = -min;
  data.forEach(function (group) {
    var val = parseFloat(group[key]) || 0;
    if (val !== misval) {
      min = min <= val ? min : val;
      max = max >= val ? max : val;
    }
  });

  if (min === Number.MAX_VALUE) {
    // no data, no normalization
    norm = function (v) { return 1; };
  } else if (min < 0 && max > 0) {
    // bubble radius should always be positive,
    // so take abs, and normalize by largest of |min| and max
    min = Math.abs(min);
    max = max < min ? min : max;
    norm = function (v) {
      return Math.abs(v) / max;
    };
  } else if ((max > 0 && min > 0) || (max < 0 && min < 0)) {
    // linear map v from [min, max] to [0,1]
    norm = function (v) {
      return (v - min) / (max - min);
    };
  } else {
    // not sure if ever reached
    norm = function (v) { return 1; };
  }
  return norm;
}

function deinitChart (view) {
  if (view._chartjs) {
    view._chartjs.destroy();
    delete view._chartjs;
  }
  delete view._config;

  var canvas = view.queryByHook('canvas');
  if (canvas) {
    view.el.removeChild(canvas);
  }
}

function initChart (view) {
  var filter = view.model.filter;
  var canSelect = true;
  var partition;

  // tear down existing stuff
  deinitChart(view);

  // Configure plot
  view._config = view.model.chartjsConfig();
  var options = view._config.options;

  // configure x-axis
  partition = filter.partitions.get(1, 'rank');

  if (partition.isDatetime) {
    options.scales.xAxes[0].type = 'time';
  } else if (partition.isContinuous) {
    if (partition.groupLog) {
      options.scales.xAxes[0].type = 'logarithmic';
    } else {
      options.scales.xAxes[0].type = 'linear';
    }
  } else {
    canSelect = false;
  }

  // configure y-axis
  // NOTE: chartjs cannot do timescale on the y-axis..?
  partition = filter.partitions.get(2, 'rank');

  if (partition.isDatetime) {
    options.scales.yAxes[0].type = 'time';
  } else if (partition.isContinuous) {
    if (partition.groupLog) {
      options.scales.yAxes[0].type = 'logarithmic';
    } else {
      options.scales.yAxes[0].type = 'linear';
    }
  } else {
    canSelect = false;
  }

  // axis labels and title
  options.scales.xAxes[0].scaleLabel.labelString = view.model.getXLabel();
  options.scales.yAxes[0].scaleLabel.labelString = view.model.getYLabel();
  options.title.text = view.model.getTitle();

  // user interaction
  if (canSelect) {
    options.onClick = function (ev, elements) {
      if (!view.model.filter.isConfigured) {
        return;
      }

      var primary = filter.partitions.get(1, 'rank');
      var secondary = filter.partitions.get(2, 'rank');

      if (elements && elements[0]) {
        // get the clicked-on bubble
        var index = elements[0]._index;
        var point = view._config.data.datasets[0].data[index];

        // update selection on x-axis
        var groupx = primary.groups.models[point.i];
        primary.updateSelection(groupx);

        // update selection on y-axis
        var groupy = secondary.groups.models[point.j];
        secondary.updateSelection(groupy);
      } else {
        primary.updateSelection();
        secondary.updateSelection();
      }
      view.model.filter.updateDataFilter();
    };
  }

  // force a square full size plot
  var width = view.el.offsetWidth;
  var height = view.el.offsetHeight;

  var canvas = document.createElement('canvas');
  canvas.setAttribute('data-hook', 'canvas');
  view.el.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  ctx.canvas.width = width;
  ctx.canvas.height = height;

  // Create Chartjs object
  view._chartjs = new Chart(ctx, view._config);

  // In callbacks on the chart we will need the view, so store a reference
  view._chartjs._Ampersandview = view;
}

function updateBubbles (view) {
  var filter = view.model.filter;
  var chartData = view._config.data;

  var primary = filter.partitions.get(1, 'rank');
  var secondary = filter.partitions.get(2, 'rank');

  var xgroups = primary.groups;
  var ygroups = secondary.groups;

  // create lookup hashes
  var AtoI = {};
  var BtoJ = {};

  xgroups.forEach(function (xbin, i) {
    AtoI[xbin.value.toString()] = i;
  });
  ygroups.forEach(function (ybin, j) {
    BtoJ[ybin.value.toString()] = j;
  });

  // Define data structure for chartjs
  // Try to keep as much of the existing structure as possbile to prevent excessive animations
  chartData.datasets[0] = chartData.datasets[0] || {};
  chartData.datasets[0].data = chartData.datasets[0].data || [{}];
  chartData.datasets[0].backgroundColor = chartData.datasets[0].backgroundColor || [];

  // find facet names for tooltips
  chartData.datasets[0].spotAxes = {
    x: app.me.dataset.facets.get(primary.facetId).name,
    y: app.me.dataset.facets.get(secondary.facetId).name
  };
  var aggregate;
  aggregate = filter.aggregates.get(1, 'rank');
  if (aggregate) {
    chartData.datasets[0].spotAxes.r = app.me.dataset.facets.get(aggregate.facetId).name;
  }
  aggregate = filter.aggregates.get(2, 'rank');
  if (aggregate) {
    chartData.datasets[0].spotAxes.c = app.me.dataset.facets.get(aggregate.facetId).name;
  }

  var normR = normalizeGroup(filter.data, 'aa');
  var normC = normalizeGroup(filter.data, 'bb');

  // add data
  var d = 0;
  filter.data.forEach(function (group) {
    if (AtoI.hasOwnProperty(group.a) && BtoJ.hasOwnProperty(group.b) && group.aa !== misval && group.bb !== misval) {
      var i = AtoI[group.a];
      var j = BtoJ[group.b];

      var valA = parseFloat(group.aa) || 0;
      var valB = parseFloat(group.bb) || 0;

      if (i === +i && j === +j) {
        chartData.datasets[0].data[d] = chartData.datasets[0].data[d] || {};
        if (primary.isDatetime || primary.isContinuous) {
          chartData.datasets[0].data[d].x = xgroups.models[i].value;
        } else {
          chartData.datasets[0].data[d].x = i;
        }
        if (secondary.isDatetime || secondary.isContinuous) {
          chartData.datasets[0].data[d].y = ygroups.models[j].value;
        } else {
          chartData.datasets[0].data[d].y = j;
        }
        chartData.datasets[0].data[d].r = normR(valA) * MAX_BUBBLE_SIZE;
        chartData.datasets[0].backgroundColor[d] = colors.getColorFloat(normC(valB)).css();

        // store group indexes for onClick callback
        chartData.datasets[0].data[d].i = i;
        chartData.datasets[0].data[d].j = j;
        chartData.datasets[0].data[d].a = group.a;
        chartData.datasets[0].data[d].b = group.b;
        chartData.datasets[0].data[d].aa = group.aa;
        chartData.datasets[0].data[d].bb = group.bb;
        d++;
      }
    }
  });

  // remove remaining (unused) points
  var cut = chartData.datasets[0].data.length - d;
  if (cut > 0) {
    chartData.datasets[0].data.splice(d, cut);
    chartData.datasets[0].backgroundColor.splice(d, cut);
  }

  // highlight selected area
  if ((primary.isDatetime || primary.isContinuous) && (secondary.isDatetime || secondary.isContinuous)) {
    if (primary.selected && primary.selected.length > 0) {
      chartData.datasets[1] = chartData.datasets[1] || {
        type: 'line',
        lineTension: 0
      };
      chartData.datasets[1].data = [
        { x: primary.selected[0], y: secondary.selected[0], r: 1 },
        { x: primary.selected[0], y: secondary.selected[1], r: 1 },
        { x: primary.selected[1], y: secondary.selected[1], r: 1 },
        { x: primary.selected[1], y: secondary.selected[0], r: 1 },
        { x: primary.selected[0], y: secondary.selected[0], r: 1 }
      ];
      chartData.datasets[1].backgroundColor = colors.getColor(1);
    } else {
      chartData.datasets.splice(1, 1);
    }
  }
}

module.exports = AmpersandView.extend({
  template: '<div class="widgetInner mdl-card__media"></div>',
  renderContent: function () {
    var filter = this.model.filter;

    // redraw when the model indicates new data is available
    filter.on('newData', function () {
      this.update();
    }, this);

    // render data if available
    if (filter.isConfigured && filter.data) {
      this.update();
    }
  },

  update: function () {
    var filter = this.model.filter;

    if (filter.isConfigured && (!this._chartjs)) {
      initChart(this);
    }

    if (filter.isConfigured) {
      updateBubbles(this);

      // Hand over to Chartjs for actual plotting
      this._chartjs.update();
    }
  },

  initChart: function () {
    initChart(this);
  },

  deinitChart: function () {
    deinitChart(this);
  }
});
