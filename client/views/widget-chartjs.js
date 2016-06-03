var ContentView = require('./widget-content');
var templates = require('../templates');
var Chart = require('chart.js');
var filters = require('../filters');
var colors = require('../colors');
var chroma = require('chroma-js');

function destroyChart (view) {
  // tear down existing stuff
  if (view._chartjs) {
    view._chartjs.destroy();
    delete view._chartjs;
  }
  delete view._config;
}

function hasNumericAxis (model) {
  return (model.getType() === 'barchart' || model.getType() === 'linechart');
}

function hasPerItemColor (model) {
  // data  Array
  // color depending on plot type:
  //           Array<Color>: barchart, polarareachart, piechart
  //           Color:        linechart, radarchart
  return (model.getType() === 'barchart' || model.getType() === 'polarareachart' || model.getType() === 'piechart');
}

function alwaysShowLegend (model) {
  return (model.getType() === 'barchart' || model.getType() === 'radarchart' || model.getType() === 'linechart');
}

// true: color items by the index in the data array; for cateogrial facets
// false:  color items by the index of their subgroup
function colorByIndex (model) {
  return (model.getType() === 'piechart' || model.getType() === 'polarareachart');
}

function initChart (view) {
  var model = view.model;

  // Configure plot
  view._config = model.chartjs_config();
  var options = view._config.options;

  // axis types
  if (hasNumericAxis(model)) {
    var valueFacet = model.tertiary || model.secondary || model.primary;
    if (valueFacet) {
      if (valueFacet.groupLog || valueFacet.transformExceedances) {
        options.scales.yAxes[0].type = 'logarithmic';
        options.scales.yAxes[0].stacked = false;
      } else {
        options.scales.yAxes[0].type = 'linear';
      }
    }
  }

  // mouse selection callbacks
  if (model.getType() !== 'linechart' && model.getType() !== 'radarchart') {
    options.onClick = onClick;
  }

  // Create Chartjs object
  view._chartjs = new Chart(view.queryByHook('chart-area').getContext('2d'), view._config);

  // In callbacks on the chart we will need the view, so store a reference
  view._chartjs._Ampersandview = view;
}

// Called by Chartjs, this -> chart instance
function onClick (ev, elements) {
  var that = this._Ampersandview.model;
  var xbins = this._Ampersandview._xbins;

  if (elements.length > 0) {
    var clickedBin = xbins[elements[0]._index];
    that.updateFilter(clickedBin.group);
  } else {
    that.selection = [];
    that.setFilter();
  }
}

module.exports = ContentView.extend({
  template: templates.includes.widgetcontent,
  renderContent: function () {
    // add a default chart to the view
    initChart(this);

    // redraw when the widgets indicates new data is available
    this.model.on('newdata', function () {
      this.update();
    }, this);

    // reset the plot when the facets change
    this.model.on('updatefacets', function () {
      destroyChart(this);
      initChart(this);
      this.update();
    }, this);

    this.model.setFilter();
  },
  update: function () {
    var model = this.model;
    var chartData = this._config.data;

    var AtoI = {};
    var BtoJ = {};

    // prepare data structure, reuse as much of the previous data arrays as possible
    // to prevent massive animations on every update

    // labels along the xAxes, keep a reference to resolve mouseclicks
    var xbins = this.model.primary.bins;
    this._xbins = xbins;

    var cut = chartData.labels.length - xbins.length;
    if (cut > 0) {
      chartData.labels.splice(0, cut);
    }
    xbins.forEach(function (xbin, i) {
      chartData.labels[i] = xbin.label;
      AtoI[xbin.label] = i;
    });

    // labels along yAxes
    var ybins = [{label: 1}];
    if (this.model.secondary) {
      ybins = this.model.secondary.bins;
    }

    // for each subgroup...
    ybins.forEach(function (ybin, j) {
      // Update or assign data structure:
      chartData.datasets[j] = chartData.datasets[j] || {data: []};

      // match the existing number of groups to the updated number of groups
      var cut = chartData.datasets[j].data.length - xbins.length;
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
        chartData.datasets[j].backgroundColor = colors.get(j).alpha(0.75).css();
      }

      // clear out old data / pre-allocate new data
      var i;
      for (i = 0; i < xbins.length; i++) {
        chartData.datasets[j].data[i] = 0;
      }

      // add a legend entry
      chartData.datasets[j].label = ybin.label;
      BtoJ[ybin.label] = j;
    });

    // update legends and tooltips
    if (alwaysShowLegend(model)) {
      this._config.options.legend.display = true;
      this._config.options.tooltips.mode = 'single';
    } else {
      if (ybins.length === 1) {
        this._config.options.legend.display = false;
        this._config.options.tooltips.mode = 'single';
      } else {
        this._config.options.legend.display = true;
        this._config.options.tooltips.mode = 'label';
      }
    }

    // add datapoints
    model.data.forEach(function (group) {
      if (AtoI.hasOwnProperty(group.a) && BtoJ.hasOwnProperty(group.b)) {
        var i = AtoI[group.a];
        var j = BtoJ[group.b];

        // data value
        chartData.datasets[j].data[i] = parseFloat(group.c) || 0;

        // data color
        if (hasPerItemColor(model)) {
          if (filters.isSelected(model, xbins[i].value)) {
            if (colorByIndex(model)) {
              chartData.datasets[j].backgroundColor[i] = colors.get(i).css();
            } else {
              chartData.datasets[j].backgroundColor[i] = colors.get(j).css();
            }
          } else {
            chartData.datasets[j].backgroundColor[i] = chroma('#aaaaaa').css();
          }
        }
      }
    });

    // Logarithmic plots

    // prevent zero values in logarithmic plots, map them to 10% of the lowest value in the plot
    var valueFacet = model.tertiary || model.secondary || model.primary;
    var minval = Number.MAX_VALUE;

    if (valueFacet && (valueFacet.groupLog || valueFacet.transformExceedances)) {
      // find smallest value with a defined logarithm
      chartData.datasets.forEach(function (dataset, j) {
        dataset.data.forEach(function (value, i) {
          if (value < minval && value > 0) {
            minval = value;
          }
        });
      });

      if (minval === Number.MAX_VALUE) minval = 1;

      // Set logarithmic scale for the charts that use it
      if (hasNumericAxis(model)) {
        this._config.options.scales.yAxes[0].ticks.min = minval * 0.5;
      }

      chartData.datasets.forEach(function (dataset, j) {
        dataset.data.forEach(function (value, i) {
          // update values for logarithmic scales
          if (hasNumericAxis(model)) {
            if (value < minval) {
              chartData.datasets[j].data[i] = minval * 0.1;
            }
          } else {
            // fake a logarithmic scale by taking a logarithm ourselves.
            if (value < minval) {
              chartData.datasets[j].data[i] = 0;
            } else {
              chartData.datasets[j].data[i] = Math.log(chartData.datasets[j].data[i]) / Math.log(10.0);
            }
          }
        });
      });
    }

    // Hand-off to ChartJS for plotting
    this._chartjs.update();
  }
});
