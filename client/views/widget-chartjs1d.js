var AmpersandView = require('ampersand-view');
var templates = require('../templates');
var Chart = require('chart.js');
var colors = require('../colors');
var misval = require('../misval');

function initChart (view) {
  var filter = view.model.filter;
  var partition = filter.partitions.get('1', 'rank');

  // Configure plot
  view._config = view.model.chartjsConfig();
  var options = view._config.options;

  // axis types
  if (partition.isDatetime) {
    options.scales.xAxes[0].type = 'time';
  }

  // mouse interaction
  options.onClick = onClick;

  // Create Chartjs object
  view._chartjs = new Chart(view.queryByHook('chart-area').getContext('2d'), view._config);

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
  template: templates.includes.widgetcontent,
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
      chartData.datasets[j].backgroundColor = colors.getColor(j).alpha(0.75).css();

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
  }
});
