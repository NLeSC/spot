var app = require('ampersand-app');
var Spot = require('spot-framework');
var BaseWidget = require('./base-widget');
var Chart = require('chart.js');
var colors = require('../../colors');
var misval = Spot.util.misval;
var util = require('./util');

var BUBBLE_ALPHA = 0.5;
var MAX_BUBBLE_SIZE = 50; // in pixels
var MIN_BUBBLE_SIZE = 5; // in pixels

function normalizeGroup (data, key) {
  var norm;
  var min = Number.MAX_VALUE;
  var max = -min;
  data.forEach(function (group) {
    if (group.count !== 0) {
      var val = parseFloat(group[key]) || 0;
      if (val !== misval) {
        min = min <= val ? min : val;
        max = max >= val ? max : val;
      }
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
  view.isInitialized = false;
}

function initChart (view) {
  // Configure plot
  view._config = view.model.chartjsConfig();
  var options = view._config.options;

  var filter = view.model.filter;
  var partition;

  var canSelect = true;

  // configure x-axis
  partition = filter.partitions.get(1, 'rank');

  if (partition.isDatetime) {
    options.scales.xAxes[0].type = 'time';
  } else if (partition.isDuration) {
    options.scales.xAxes[0].type = 'spot-duration';
  } else if (partition.isContinuous) {
    if (partition.groupLog) {
      options.scales.xAxes[0].type = 'logarithmic';
    } else {
      options.scales.xAxes[0].type = 'linear';
    }
  } else {
    canSelect = false;
  }
  options.scales.xAxes[0].scaleLabel = {
    display: partition.showLabel,
    labelString: partition.label
  };

  // configure y-axis
  partition = filter.partitions.get(2, 'rank');

  if (partition.isDatetime) {
    options.scales.yAxes[0].type = 'time';
  } else if (partition.isDuration) {
    options.scales.yAxes[0].type = 'spot-duration';
  } else if (partition.isContinuous) {
    if (partition.groupLog) {
      options.scales.yAxes[0].type = 'logarithmic';
    } else {
      options.scales.yAxes[0].type = 'linear';
    }
  } else {
    canSelect = false;
  }
  options.scales.yAxes[0].scaleLabel = {
    display: partition.showLabel,
    labelString: partition.label
  };

  // title
  options.title.text = view.model.getTitle();

  // user interaction
  if (canSelect) {
    options.onClick = function (ev, elements) {
      var partitionA = filter.partitions.get(1, 'rank');
      var partitionB = filter.partitions.get(2, 'rank');

      if (elements && elements[0]) {
        // get the clicked-on bubble
        var index = elements[0]._index;
        var point = view._config.data.datasets[0].data[index];

        // update selection on x-axis
        var groupx = partitionA.groups.models[point.i];
        partitionA.updateSelection(groupx);

        // update selection on y-axis
        var groupy = partitionB.groups.models[point.j];
        partitionB.updateSelection(groupy);

        view.model.filter.updateDataFilter();
        app.me.dataview.getData();
      }
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

  view.isInitialized = true;
}

function update (view) {
  if (!view.isInitialized) {
    return;
  }

  // Add our data to the plot
  updateBubbles(view);

  // Hand over to Chartjs for actual plotting
  view._chartjs.update();
}

function updateBubbles (view) {
  var filter = view.model.filter;
  var chartData = view._config.data;

  var partitionA = filter.partitions.get(1, 'rank');
  var partitionB = filter.partitions.get(2, 'rank');

  chartData.datasets = chartData.datasets || [];
  chartData.datasets[0] = chartData.datasets[0] || { data: [], error: [], backgroundColor: [] };

  // find facet names for tooltips
  chartData.datasets[0].spotAxes = {
    x: partitionA.name,
    y: partitionB.name
  };

  var aggregate;
  var bubbleColorFn; // normalization function for bubble color
  var bubbleRadiusFn; // normalization function for bubble radius
  var errorXFn;
  var errorYFn;

  aggregate = filter.aggregates.get(1, 'rank');
  if (aggregate) {
    bubbleColorFn = normalizeGroup(filter.data, 'aa');
    chartData.datasets[0].spotAxes.c = aggregate.operation + ' ' + aggregate.label;
  }

  aggregate = filter.aggregates.get(2, 'rank');
  if (aggregate) {
    bubbleRadiusFn = normalizeGroup(filter.data, 'bb');
    chartData.datasets[0].spotAxes.r = aggregate.operation + ' ' + aggregate.label;
  }

  view._config.options.errorDir = 'both';
  aggregate = filter.aggregates.get(3, 'rank');
  if (aggregate) {
    errorXFn = function (group) { return group['cc']; };
  } else {
    errorXFn = function (group) { return null; };
    view._config.options.errorDir = 'vertical';
  }

  aggregate = filter.aggregates.get(4, 'rank');
  if (aggregate) {
    errorYFn = function (group) { return group['dd']; };
  } else {
    errorYFn = function (group) { return null; };
    if (view._config.options.errorDir === 'vertical') {
      view._config.options.errorDir === 'none';
    }
    if (view._config.options.errorDir === 'both') {
      view._config.options.errorDir === 'horizontal';
    }
  }

  // add data
  var val;
  var d = 0;
  filter.data.forEach(function (group) {
    var i = util.partitionValueToIndex(partitionA, group.a);
    var j = util.partitionValueToIndex(partitionB, group.b);

    if (i === +i && j === +j && group.aa !== misval && group.bb !== misval && group.count !== 0) {
      // initialize if necessary
      chartData.datasets[0].data[d] = chartData.datasets[0].data[d] || {};
      chartData.datasets[0].error[d] = chartData.datasets[0].error[d] || {};

      // update position
      if (partitionA.isDatetime || partitionA.isDuration || partitionA.isContinuous) {
        chartData.datasets[0].data[d].x = partitionA.groups.models[i].value;
      } else {
        chartData.datasets[0].data[d].x = i;
      }

      if (partitionB.isDatetime || partitionB.isDuration || partitionB.isContinuous) {
        chartData.datasets[0].data[d].y = partitionB.groups.models[j].value;
      } else {
        chartData.datasets[0].data[d].y = j;
      }

      // update error
      chartData.datasets[0].error[d].x = errorXFn(group);
      chartData.datasets[0].error[d].y = errorYFn(group);

      // update color
      val = parseFloat(group.aa) || 0;
      if (bubbleColorFn) {
        chartData.datasets[0].backgroundColor[d] = colors.getColorFloat(bubbleColorFn(val)).alpha(BUBBLE_ALPHA).css();
      } else {
        chartData.datasets[0].backgroundColor[d] = colors.getColor(0).alpha(BUBBLE_ALPHA).css();
      }

      // update radius
      val = parseFloat(group.bb) || 0;
      if (bubbleRadiusFn) {
        chartData.datasets[0].data[d].r = Math.round(MIN_BUBBLE_SIZE + Math.sqrt(bubbleRadiusFn(val)) * (MAX_BUBBLE_SIZE - MIN_BUBBLE_SIZE));
      } else {
        chartData.datasets[0].data[d].r = MIN_BUBBLE_SIZE; // NOTE: in pixels
      }

      // store group indexes for onClick callback
      chartData.datasets[0].data[d].i = i;
      chartData.datasets[0].data[d].j = j;
      chartData.datasets[0].data[d].a = group.a;
      chartData.datasets[0].data[d].b = group.b;
      chartData.datasets[0].data[d].aa = group.aa;
      chartData.datasets[0].data[d].bb = group.bb;
      chartData.datasets[0].data[d].count = group.count;
      d++;
    }
  });

  // remove remaining (unused) points
  var cut = chartData.datasets[0].data.length - d;
  if (cut > 0) {
    chartData.datasets[0].data.splice(d, cut);
    chartData.datasets[0].error.splice(d, cut);
    chartData.datasets[0].backgroundColor.splice(d, cut);
  }

  // highlight selected area
  if (
    (partitionA.isDatetime || partitionA.isDuration || partitionA.isContinuous) &&
    (partitionB.isDatetime || partitionB.isDuration || partitionB.isContinuous)) {
    if (partitionA.selected && partitionA.selected.length > 0) {
      chartData.datasets[1] = chartData.datasets[1] || {
        type: 'line',
        lineTension: 0
      };
      chartData.datasets[1].data = [
        { x: partitionA.selected[0], y: partitionB.selected[0], r: 1 },
        { x: partitionA.selected[0], y: partitionB.selected[1], r: 1 },
        { x: partitionA.selected[1], y: partitionB.selected[1], r: 1 },
        { x: partitionA.selected[1], y: partitionB.selected[0], r: 1 },
        { x: partitionA.selected[0], y: partitionB.selected[0], r: 1 }
      ];
      chartData.datasets[1].error = [null, null, null, null];
      chartData.datasets[1].backgroundColor = colors.getColor(1).alpha(BUBBLE_ALPHA).css();
    } else {
      chartData.datasets.splice(1, 1);
    }
  }
}

module.exports = BaseWidget.extend({
  template: '<div class="widgetInner mdl-card__media"></div>',

  update: function () {
    update(this);
  },

  initChart: function () {
    initChart(this);
  },

  deinitChart: function () {
    deinitChart(this);
  }
});
