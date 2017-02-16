var BaseWidget = require('./base-widget');
var Chart = require('chart.js');
var colors = require('../../colors');
var misval = require('../../../framework/util/misval.js');

// modify the horizontalbarchart to have the group name printed on the bar
Chart.pluginService.register({
  afterDatasetsDraw: function (chartInstance) {
    var chartType = chartInstance.config.type;

    if (chartType === 'horizontalBar') {
      var scale = chartInstance.scales['y-axis-0'];
      scale.draw(scale);
    }
  }
});

function maximumLength (model) {
  var t = model.getType();
  if (t === 'horizontalbarchart') {
    return 25;
  }
  return 1000; // FIXME something largeish..
}

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
  var that = this._Ampersandview.model;

  if (!(that.filter.isConfigured)) {
    return;
  }
  var xgroups = this._Ampersandview._xgroups;
  var partition = that.filter.partitions.get(1, 'rank');

  if (elements.length > 0) {
    var clickedBin = xgroups.models[elements[0]._index];
    partition.updateSelection(clickedBin);
  } else {
    partition.updateSelection();
  }
  this._Ampersandview._filterFunction = partition.filterFunction();
  that.filter.updateDataFilter();
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

  var AtoI = {};
  var BtoJ = {};
  var cut;

  // prepare data structure, reuse as much of the previous data arrays as possible
  // to prevent massive animations on every update

  var xgroups = partitionA.groups;
  if (partitionA.isText) {
    // For text partitions we do not know what groups to expect
    xgroups.reset();
  }

  // labels along the xAxes, keep a reference to resolve mouseclicks
  view._xgroups = xgroups;

  // find top-N of the data:
  // 1. reset count
  xgroups.forEach(function (group) {
    group.count = 0;
  });
  // 2. sum all data
  filter.data.forEach(function (d) {
    var group;
    if (partitionA.isText) {
      xgroups.add({
        value: d.a,
        count: parseFloat(d.aa)
      });
    } else {
      group = xgroups.get(d.a, 'value');
      if (group) {
        if (d.aa !== misval) {
          group.count += parseFloat(d.aa);
        }
      }
    }
  });
  // 3. update sorting
  xgroups.sort();

  cut = chartData.labels.length - maximumLength(model);
  if (cut > 0) {
    chartData.labels.splice(0, cut);
  }

  // match number of groups
  xgroups.forEach(function (xbin, i) {
    if (i < maximumLength(model)) {
      chartData.labels[i] = xbin.value;
      AtoI[xbin.value.toString()] = i;
    }
  });

  // labels along yAxes (subgroups)
  var ygroups = [{label: '1', value: 1}];
  if (partitionB) {
    ygroups = partitionB.groups;
  }

  // match the number of subgroups
  cut = chartData.datasets.length - ygroups.length;
  if (cut > 0) {
    chartData.datasets.splice(0, cut);
  }

  // for each subgroup...
  ygroups.forEach(function (ybin, j) {
    // Update or assign data structure:
    chartData.datasets[j] = chartData.datasets[j] || {data: []};

    // match the existing number of groups to the updated number of groups
    cut = chartData.datasets[j].data.length - maximumLength(model);
    if (cut > 0) {
      chartData.datasets[j].data.splice(0, cut);
    }

    if (hasPerItemColor(model)) {
      if (chartData.datasets[j].backgroundColor instanceof Array) {
        if (cut > 0) {
          chartData.datasets[j].backgroundColor.splice(0, cut);
        }
      } else {
        chartData.datasets[j].backgroundColor = [];
      }
    } else {
      chartData.datasets[j].backgroundColor = colors.getColor(j).css();
    }

    // clear out old data / pre-allocate new data
    var i;
    for (i = 0; i < maximumLength(model); i++) {
      chartData.datasets[j].data[i] = 0;
    }

    // add a legend entry
    chartData.datasets[j].label = ybin.value;
    BtoJ[ybin.value.toString()] = j;
  });

  // update legends and tooltips
  if (alwaysShowLegend(model)) {
    view._config.options.legend.display = true;
    view._config.options.tooltips.mode = 'single';
  } else if (neverShowLegend(model)) {
    view._config.options.legend.display = false;
    if (ygroups.length === 1) {
      view._config.options.tooltips.mode = 'single';
    } else {
      view._config.options.tooltips.mode = 'label';
    }
  } else {
    if (ygroups.length === 1) {
      view._config.options.legend.display = false;
      view._config.options.tooltips.mode = 'single';
    } else {
      view._config.options.legend.display = true;
      view._config.options.tooltips.mode = 'label';
    }
  }

  // add datapoints
  filter.data.forEach(function (group) {
    var i = group.hasOwnProperty('a') ? AtoI[group.a.toString()] : 0;
    var j = group.hasOwnProperty('b') ? BtoJ[group.b.toString()] : 0;

    // only plot if both values are well defined
    if (i === +i && j === +j) {
      // data value
      if (group.aa !== misval) {
        chartData.datasets[j].data[i] = parseFloat(group.aa) || 0;
      } else {
        chartData.datasets[j].data[i] = 0;
      }

      // data color
      if (hasPerItemColor(model)) {
        if (view._filterFunction(xgroups.models[i].value)) {
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

