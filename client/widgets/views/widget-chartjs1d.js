var AmpersandView = require('ampersand-view');
var Chart = require('chart.js');
var colors = require('../../colors');
var misval = require('../../../framework/util/misval.js');

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

    xgroups.forEach(function (xbin, i) {
      AtoI[xbin.value.toString()] = i;
    });

    // labels along yAxes
    var ygroups = [{label: '1', value: 1}];
    if (partitionB) {
      ygroups = partitionB.groups;
    }

    // match the number of subgroups
    var cut = chartData.datasets.length - ygroups.length;
    if (cut > 0) {
      chartData.datasets.splice(0, cut);
    }

    // for each subgroup...
    ygroups.forEach(function (ybin, j) {
      // update or assign data structure:
      chartData.datasets[j] = chartData.datasets[j] || {data: []};

      // match the existing number of groups to the updated number of groups
      var cut = chartData.datasets[j].data.length - xgroups.length;
      if (cut > 0) {
        chartData.datasets[j].data.splice(0, cut);
      }

      // set dataset color
      chartData.datasets[j].backgroundColor = colors.getColor(j).css();

      // clear out old data / pre-allocate new data
      var i;
      for (i = 0; i < xgroups.length; i++) {
        chartData.datasets[j].data[i] = {};
      }

      // add a legend entry
      chartData.datasets[j].label = ybin.value;
      BtoJ[ybin.value.toString()] = j;
    });

    // update legends and tooltips
    if (ygroups.length === 1) {
      this._config.options.legend.display = false;
      this._config.options.tooltips.mode = 'single';
    } else {
      this._config.options.legend.display = true;
      this._config.options.tooltips.mode = 'label';
    }

    // add datapoints
    filter.data.forEach(function (group) {
      var i = group.hasOwnProperty('a') ? AtoI[group.a.toString()] : 0;
      var j = group.hasOwnProperty('b') ? BtoJ[group.b.toString()] : 0;

      if (i === +i && j === +j) {
        // data value
        chartData.datasets[j].data[i].x = group.a;
        if (group.aa !== misval) {
          chartData.datasets[j].data[i].y = group.aa;
        } else {
          chartData.datasets[j].data[i].y = null;
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
