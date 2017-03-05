var BaseWidget = require('./base-widget');
var Chart = require('chart.js');
var misval = require('../../../framework/util/misval.js');
var util = require('./util');

// Called by Chartjs, this -> chart instance
function onClick (ev, elements) {
  var filter = this._Ampersandview.model.filter;

  if (!(filter.isConfigured)) {
    return;
  }
  var partition = filter.partitions.get(1, 'rank');

  if (elements.length > 0) {
    partition.updateSelection(partition.groups.models[elements[0]._index]);
  } else {
    partition.updateSelection();
  }
  filter.updateDataFilter();
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
  var partitionA = filter.partitions.get(1, 'rank');

  // tear down existing stuff
  deinitChart(view);

  // Configure plot
  view._config = view.model.chartjsConfig();
  var options = view._config.options;

  // axis types
  if (partitionA.isDatetime) {
    options.scales.xAxes[0].type = 'time';
  } else if (partitionA.isDuration) {
    options.scales.xAxes[0].type = 'spot-duration';
  }

  // axis labels and title
  options.scales.xAxes[0].scaleLabel.labelString = view.model.getXLabel();
  options.title.text = view.model.getTitle();

  // mouse interaction
  options.onClick = onClick;

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

function update (view) {
  var filter = view.model.filter;

  if (filter.isConfigured) {
    if (!view._chartjs) {
      initChart(view);
    }
  } else {
    deinitChart(view);
    return;
  }

  var partitionA = filter.partitions.get(1, 'rank');
  var partitionB = filter.partitions.get(2, 'rank');

  var chartData = view._config.data;

  util.resizeChartjsData(chartData, partitionA, partitionB, { multiDimensional: true });

  // update legends and tooltips
  if (partitionB && partitionB.groups && partitionB.groups.length > 1) {
    view._config.options.legend.display = true;
    view._config.options.tooltips.mode = 'label';
  } else {
    view._config.options.legend.display = false;
    view._config.options.tooltips.mode = 'single';
  }

  var aggregate = filter.aggregates.get(1, 'rank');
  var valueFn;
  if (aggregate) {
    valueFn = function (group) {
      if (group.aa !== misval) {
        return parseFloat(group.aa) || null;
      }
      return null;
    };
  } else {
    valueFn = function (group) {
      if (group.count !== misval) {
        return group.count;
      }
      return null;
    };
  }

  // add datapoints
  filter.data.forEach(function (group) {
    var i = util.partitionValueToIndex(partitionA, group.a);
    var j = util.partitionValueToIndex(partitionB, group.b);

    if (i === +i && j === +j) {
      // data value
      chartData.datasets[j].data[i].x = group.a;
      chartData.datasets[j].data[i].y = valueFn(group);
    }
  });

  // Hand-off to ChartJS for plotting
  view._chartjs.update();

  // TODO: draw selection box
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
