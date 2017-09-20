var app = require('ampersand-app');
var Spot = require('spot-framework');
var BaseWidget = require('./base-widget');
var Chart = require('chart.js');
var colors = require('../../colors');
var misval = Spot.util.misval;
var util = require('./util');

// Called by Chartjs, this -> chart instance
function onClick (ev, elements) {
  var model = this._Ampersandview.model;
  var partition = model.filter.partitions.get(1, 'rank');

  if (elements.length > 0) {
    partition.updateSelection(partition.groups.models[elements[0]._index]);
    model.filter.updateDataFilter();
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
    view.el.removeChild(canvas);
  }
  view.isInitialized = false;
}

function initChart (view) {
  // Configure plot
  view._config = view.model.chartjsConfig();
  var options = view._config.options;

  // axis types
  var partitionA = view.model.filter.partitions.get(1, 'rank');
  if (partitionA.isDatetime) {
    options.scales.xAxes[0].type = 'time';
  } else if (partitionA.isDuration) {
    options.scales.xAxes[0].type = 'spot-duration';
  }
  options.scales.xAxes[0].scaleLabel = {
    display: partitionA.showLabel,
    labelString: partitionA.label
  };

  // title
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

  var aggregateD = view.model.filter.aggregates.get(4, 'rank');
  if (aggregateD) {
    // show secondary y Axis on the right when we have a second y variable
    view._config.options.scales.yAxes[1].display = true;
  }

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

  var filter = view.model.filter;
  var partitionA = filter.partitions.get(1, 'rank');
  var partitionB = filter.partitions.get(2, 'rank');

  var chartData = view._config.data;
  var datasetCount;
  var secondYOffset;

  // update legends and tooltips
  if (partitionB && partitionB.groups && partitionB.groups.length > 1) {
    // we have sub-grouping
    view._config.options.legend.display = partitionB.showLegend;
    view._config.options.tooltips.mode = 'label';
    datasetCount = partitionB.groups.length;
  } else {
    view._config.options.legend.display = false;
    view._config.options.tooltips.mode = 'single';
    datasetCount = 1;
  }

  var aggregate;

  aggregate = filter.aggregates.get(1, 'rank');
  var valueFn;
  if (aggregate) {
    valueFn = function (group) {
      if (group.count !== misval && group.aa !== misval) {
        return parseFloat(group.aa) || null;
      }
      return null;
    };
  } else {
    valueFn = function (group) {
      if (group.count !== misval && group.count !== 0) {
        return parseInt(group.count);
      }
      return null;
    };
  }

  view._config.options.errorDir = 'both';
  aggregate = filter.aggregates.get(2, 'rank');
  var errorXFn;
  if (aggregate) {
    errorXFn = function (group) {
      if (group.bb !== misval) {
        return parseFloat(group.bb) || 0;
      }
      return 0;
    };
  } else {
    errorXFn = function (group) { return null; };
    view._config.options.errorDir = 'vertical';
  }

  aggregate = filter.aggregates.get(3, 'rank');
  var errorYFn;
  if (aggregate) {
    errorYFn = function (group) {
      if (group.cc !== misval) {
        return parseFloat(group.cc) || 0;
      }
      return 0;
    };
  } else {
    errorYFn = function (group) { return null; };
    if (view._config.options.errorDir === 'vertical') {
      view._config.options.errorDir === 'none';
    }
    if (view._config.options.errorDir === 'both') {
      view._config.options.errorDir === 'horizontal';
    }
  }

  aggregate = filter.aggregates.get(4, 'rank');
  var secondYFn;
  if (aggregate) {
    // double the number of datasets for the second y value
    secondYOffset = datasetCount;
    datasetCount = 2 * datasetCount;
    secondYFn = function (group) {
      if (group.dd !== misval) {
        return parseFloat(group.dd) || null;
      }
      return null;
    };
  } else {
    secondYFn = false;
  }

  util.resizeChartjsData(chartData, partitionA, partitionB, {
    multiDimensional: true,
    doubleDatasets: secondYFn
  });

  // add datapoints
  filter.data.forEach(function (group) {
    var i = util.partitionValueToIndex(partitionA, group.a);
    var j = util.partitionValueToIndex(partitionB, group.b);

    if (i === +i && j === +j) {
      chartData.datasets[j].data[i].x = group.a;
      chartData.datasets[j].data[i].y = valueFn(group);
      chartData.datasets[j].error[i].x = errorXFn(group);
      chartData.datasets[j].error[i].y = errorYFn(group);
      if (secondYFn) {
        chartData.datasets[secondYOffset + j].data[i].x = group.a;
        chartData.datasets[secondYOffset + j].data[i].y = secondYFn(group);
        chartData.datasets[secondYOffset + j].error[i].x = null;
        chartData.datasets[secondYOffset + j].error[i].y = null;
        chartData.datasets[secondYOffset + j].yAxisID = 'second-scale';
      }
    }
  });

  // Add an extra dataset to hightlight selected area
  var selectionId = datasetCount;
  chartData.datasets[selectionId] = chartData.datasets[selectionId] || {
    data: [ {x: null, y: 1}, {x: null, y: 1} ],
    error: [ {x: null, y: null}, {x: null, y: null} ],
    yAxisID: 'selection-scale',
    label: 'selection',
    backgroundColor: colors.getColor(1).css(),
    borderColor: colors.getColor(1).css(),
    fill: true,
    lineTension: 0,
    pointRadius: 0
  };

  if (partitionA.selected && partitionA.selected.length > 0) {
    chartData.datasets[selectionId].data[0].x = partitionA.selected[0];
    chartData.datasets[selectionId].data[1].x = partitionA.selected[1];
  } else {
    chartData.datasets[selectionId].data[0].x = null;
    chartData.datasets[selectionId].data[1].x = null;
  }

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
