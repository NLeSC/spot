var app = require('ampersand-app');
var Spot = require('spot-framework');
var BaseWidget = require('./base-widget');
var Chart = require('chart.js');
var colors = require('../../colors');
var misval = Spot.util.misval;
var util = require('./util');

// used for pie, bar, horizontalbar, and radar charts

// modify the horizontalbarchart to have the group name printed on the bar
Chart.pluginService.register({
  afterDatasetsDraw: function (chartInstance) {
    var chartType = chartInstance.config.type;

    if (chartType === 'horizontalBarError') {
      var scale = chartInstance.scales['y-axis-0'];
      scale.draw(scale);
    }
  }
});

function defaultErrorDir (model) {
  var t = model.getType();
  if (t === 'barchart') {
    return 'vertical';
  } else if (t === 'horizontalbarchart') {
    return 'horizontal';
  } else {
    // pie radar
    return 'none';
  }
}

function acceptTimeAxis (model) {
  var t = model.getType();
  return (t === 'barchart');
}

function hasPerItemColor (model) {
  // data  Array
  // color depending on plot type:
  //           Array<Color>: barchart, piechart
  //           Color:        radarchart
  var t = model.getType();
  return (t === 'barchart' || t === 'horizontalbarchart' || t === 'piechart');
}

// true: color items by the index in the data array; for cateogrial facets
// false:  color items by the index of their subgroup
function colorByIndex (model) {
  var t = model.getType();
  return (t === 'piechart');
}

// Called by Chartjs, this -> chart instance
function onClick (ev, elements) {
  if (elements.length > 0) {
    var filter = this._Ampersandview.model.filter;

    var partition = filter.partitions.get(1, 'rank');
    partition.updateSelection(partition.groups.models[elements[0]._index]);

    filter.updateDataFilter();
    app.me.dataview.getData();
  }
}

function deinitChart (view) {
  if (view._chartjs) {
    view._chartjs.destroy();
    delete view._chartjs;
  }
  delete view._config;

  var canvas = view.queryByHook('canvas');
  if (canvas) {
    canvas.parentNode.removeChild(canvas);
  }
  view.isInitialized = false;
}

function initChart (view) {
  // Configure plot
  view._config = view.model.chartjsConfig();
  var options = view._config.options;

  var partition = view.model.filter.partitions.get(1, 'rank');

  // axis types
  if (acceptTimeAxis(view.model)) {
    if (partition.isDatetime) {
      options.scales.xAxes[0].type = 'time';
    } else if (partition.isDuration) {
      options.scales.xAxes[0].type = 'spot-duration';
    } else if (partition.isCategorial) {
      options.scales.xAxes[0].type = 'category';
    }
  }

  // axis labels and title
  if (view.model.getType() === 'barchart' || view.model.getType() === 'horizontalbarchart') {
    options.scales.xAxes[0].scaleLabel.display = partition.showLabel;
    options.scales.xAxes[0].scaleLabel.labelString = partition.label;
  }
  options.title.text = view.model.getTitle();

  // mouse selection callbacks
  if (view.model.getType() !== 'radarchart') {
    options.onClick = onClick;
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
    console.warn('Cannot update chart, not initialized', view);
    return;
  }

  var model = view.model;
  var filter = view.model.filter;
  var partitionA = filter.partitions.get(1, 'rank');
  var partitionB = filter.partitions.get(2, 'rank');

  var chartData = view._config.data;

  util.resizeChartjsData(chartData, partitionA, partitionB, { perItem: hasPerItemColor(model) });

  // update legends and tooltips:
  if (model.getType() === 'piechart') {
    view._config.options.legend.display = partitionA.showLegend;
    view._config.options.tooltips.mode = 'single';
  } else {
    if (partitionB && partitionB.showLegend) {
      view._config.options.legend.display = true;
    } else {
      view._config.options.legend.display = false;
    }
    if (partitionB && partitionB.groups && partitionB.groups.length > 1) {
      view._config.options.tooltips.mode = 'label';
    } else {
      view._config.options.tooltips.mode = 'single';
    }
  }

  var aggregate;

  var valueFn;
  aggregate = filter.aggregates.get(1, 'rank');
  if (aggregate) {
    valueFn = function (group) {
      if (group.aa !== misval) {
        return parseFloat(group.aa) || 0;
      }
      return 0;
    };
  } else {
    valueFn = function (group) {
      if (group.count !== misval) {
        return group.count;
      }
      return 0;
    };
  }

  var errorFn;
  aggregate = filter.aggregates.get(2, 'rank');
  if (aggregate) {
    errorFn = function (group) {
      if (group.bb !== misval) {
        return parseFloat(group.bb) || 0;
      }
      return 0;
    };
    // use preset errorDir
    view._config.options.errorDir = defaultErrorDir(model);
  } else {
    errorFn = function (group) { return null; };
    view._config.options.errorDir = 'none';
  }

  var filterFn = partitionA.filterFunction();

  // add datapoints
  filter.data.forEach(function (group) {
    var i = util.partitionValueToIndex(partitionA, group.a);
    var j = util.partitionValueToIndex(partitionB, group.b);

    // only plot if both values are well defined
    if (i >= 0 && j >= 0) {
      // data value
      chartData.datasets[j].data[i] = valueFn(group);
      chartData.datasets[j].error[i] = errorFn(group);

      // data color
      if (hasPerItemColor(model)) {
        if (filterFn(partitionA.groups.models[i].value)) {
          if (colorByIndex(model)) {
            chartData.datasets[j].backgroundColor[i] = colors.getColor(i).css();
          } else {
            chartData.datasets[j].backgroundColor[i] = colors.getColor(j).css();
          }
        } else {
          chartData.datasets[j].backgroundColor[i] = colors.unselectedColor.css();
        }
      }
    }
  });

  // Hand-off to ChartJS for plotting
  view._chartjs.update();
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

