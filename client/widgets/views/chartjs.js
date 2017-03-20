var BaseWidget = require('./base-widget');
var Chart = require('chart.js');
var colors = require('../../colors');
var misval = require('../../../framework/util/misval.js');
var util = require('./util');

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

function acceptXYLabel (model) {
  var t = model.getType();
  return (t === 'barchart' || t === 'horizontalbarchart');
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

function alwaysShowLegend (model) {
  var t = model.getType();
  return (t === 'piechart');
}

function neverShowLegend (model) {
  var t = model.getType();
  return (t === 'horizontalbarchart');
}

// true: color items by the index in the data array; for cateogrial facets
// false:  color items by the index of their subgroup
function colorByIndex (model) {
  var t = model.getType();
  return (t === 'piechart');
}

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
  this._Ampersandview._filterFunction = partition.filterFunction();
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
    canvas.parentNode.removeChild(canvas);
  }
}

function initChart (view) {
  var filter = view.model.filter;

  var partition = filter.partitions.get(1, 'rank');

  // Configure plot
  view._config = view.model.chartjsConfig();
  var options = view._config.options;

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
  if (acceptXYLabel(view.model)) {
    options.scales.xAxes[0].scaleLabel.labelString = view.model.getXLabel();
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

  // For rendering we will need to know if the data points are selected
  view._filterFunction = partition.filterFunction();
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

  var model = view.model;
  var partitionA = filter.partitions.get(1, 'rank');
  var partitionB = filter.partitions.get(2, 'rank');

  var chartData = view._config.data;

  util.resizeChartjsData(chartData, partitionA, partitionB, { perItem: hasPerItemColor(model) });

  // update legends and tooltips
  if (alwaysShowLegend(model)) {
    view._config.options.legend.display = true;
    view._config.options.tooltips.mode = 'single';
  } else if (neverShowLegend(model)) {
    view._config.options.legend.display = false;
    if (partitionB && partitionB.groups && partitionB.groups.length > 1) {
      view._config.options.tooltips.mode = 'label';
    } else {
      view._config.options.tooltips.mode = 'single';
    }
  } else {
    if (partitionB && partitionB.groups && partitionB.groups.length > 1) {
      view._config.options.legend.display = true;
      view._config.options.tooltips.mode = 'label';
    } else {
      view._config.options.legend.display = false;
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
  } else {
    errorFn = function (group) { return null; };
  }

  // add datapoints
  filter.data.forEach(function (group) {
    var i = util.partitionValueToIndex(partitionA, group.a);
    var j = util.partitionValueToIndex(partitionB, group.b);

    // only plot if both values are well defined
    if (i === +i && j === +j) {
      // data value
      chartData.datasets[j].data[i] = valueFn(group);
      chartData.datasets[j].error[i] = errorFn(group);

      // data color
      if (hasPerItemColor(model)) {
        if (view._filterFunction(partitionA.groups.models[i].value)) {
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

