var AmpersandView = require('ampersand-view');
var Chart = require('chart.js');
var colors = require('../colors');
var misval = require('../misval');

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
  //           Array<Color>: barchart, polarareachart, piechart
  //           Color:        radarchart
  var t = model.getType();
  return (t === 'barchart' || t === 'horizontalbarchart' || t === 'polarareachart' || t === 'piechart');
}

function alwaysShowLegend (model) {
  var t = model.getType();
  return (t === 'piechart' || t === 'polarareachart');
}

function neverShowLegend (model) {
  var t = model.getType();
  return (t === 'horizontalbarchart');
}

// true: color items by the index in the data array; for cateogrial facets
// false:  color items by the index of their subgroup
function colorByIndex (model) {
  var t = model.getType();
  return (t === 'piechart' || t === 'polarareachart');
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

  var partition = filter.partitions.get('1', 'rank');

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
}

// Called by Chartjs, this -> chart instance
function onClick (ev, elements) {
  var that = this._Ampersandview.model;

  if (!(that.filter.isConfigured)) {
    return;
  }
  var xgroups = this._Ampersandview._xgroups;
  var partition = that.filter.partitions.get('1', 'rank');

  if (elements.length > 0) {
    var clickedBin = xgroups.models[elements[0]._index];
    partition.updateSelection(clickedBin);
  } else {
    partition.updateSelection();
  }
  that.filter.updateDataFilter();
}

module.exports = AmpersandView.extend({
  template: '<div class="widgetInner mdl-card__media"></div>',
  renderContent: function () {
    var filter = this.model.filter;

    // redraw when the widgets indicates new data is available
    filter.on('newData', function () {
      this.update();
    }, this);

    // render data if available
    if (filter.isConfigured && filter.data) {
      this.update();
    }
  },
  update: function () {
    var model = this.model;
    var filter = this.model.filter;

    if (filter.isConfigured && (!this._chartjs)) {
      initChart(this);
    }

    var partitionA = filter.partitions.get(1, 'rank');
    var partitionB = filter.partitions.get(2, 'rank');

    var chartData = this._config.data;

    var AtoI = {};
    var BtoJ = {};

    // prepare data structure, reuse as much of the previous data arrays as possible
    // to prevent massive animations on every update

    // labels along the xAxes, keep a reference to resolve mouseclicks
    var xgroups = partitionA.groups;
    this._xgroups = xgroups;

    var cut = chartData.labels.length - xgroups.length;
    if (cut > 0) {
      chartData.labels.splice(0, cut);
    }
    xgroups.forEach(function (xbin, i) {
      chartData.labels[i] = xbin.value;
      AtoI[xbin.value.toString()] = i;
    });

    // labels along yAxes
    var ygroups = [{label: '1', value: 1}];
    if (partitionB) {
      ygroups = partitionB.groups;
    }

    // for each subgroup...
    ygroups.forEach(function (ybin, j) {
      // Update or assign data structure:
      chartData.datasets[j] = chartData.datasets[j] || {data: []};

      // match the existing number of groups to the updated number of groups
      var cut = chartData.datasets[j].data.length - xgroups.length;
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
        chartData.datasets[j].backgroundColor = colors.getColor(j).alpha(0.75).css();
      }

      // clear out old data / pre-allocate new data
      var i;
      for (i = 0; i < xgroups.length; i++) {
        chartData.datasets[j].data[i] = 0;
      }

      // add a legend entry
      chartData.datasets[j].label = ybin.value;
      BtoJ[ybin.value.toString()] = j;
    });

    // update legends and tooltips
    if (alwaysShowLegend(model)) {
      this._config.options.legend.display = true;
      this._config.options.tooltips.mode = 'single';
    } else if (neverShowLegend(model)) {
      this._config.options.legend.display = false;
      if (ygroups.length === 1) {
        this._config.options.tooltips.mode = 'single';
      } else {
        this._config.options.tooltips.mode = 'label';
      }
    } else {
      if (ygroups.length === 1) {
        this._config.options.legend.display = false;
        this._config.options.tooltips.mode = 'single';
      } else {
        this._config.options.legend.display = true;
        this._config.options.tooltips.mode = 'label';
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
          if (xgroups.models[i].isSelected) {
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
    this._chartjs.update();
  },

  initChart: function () {
    initChart(this);
  },

  deinitChart: function () {
    deinitChart(this);
  }
});

