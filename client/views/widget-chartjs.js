var AmpersandView = require('ampersand-view');
var templates = require('../templates');
var Chart = require('chart.js');
var colors = require('../colors');

function destroyChart (view) {
  // tear down existing stuff
  if (view._chartjs) {
    view._chartjs.destroy();
    delete view._chartjs;
  }
  delete view._config;
}

function hasNumericAxis (model) {
  var t = model.getType();
  return (t === 'barchart' || t === 'linechart');
}

function acceptTimeAxis (model) {
  var t = model.getType();
  return (t === 'linechart' || t === 'barchart');
}

function hasPerItemColor (model) {
  // data  Array
  // color depending on plot type:
  //           Array<Color>: barchart, polarareachart, piechart
  //           Color:        linechart, radarchart
  var t = model.getType();
  return (t === 'barchart' || t === 'polarareachart' || t === 'piechart');
}

function alwaysShowLegend (model) {
  var t = model.getType();
  return (t === 'piechart' || t === 'polarareachart');
}

// true: color items by the index in the data array; for cateogrial facets
// false:  color items by the index of their subgroup
function colorByIndex (model) {
  var t = model.getType();
  return (t === 'piechart' || t === 'polarareachart');
}

function initChart (view) {
  var filter = view.model.filter;

  // Configure plot
  view._config = view.model.chartjsConfig();
  var options = view._config.options;

  // axis types
  if (hasNumericAxis(view.model)) {
    var valueFacet = filter.tertiary || filter.secondary || filter.primary;
    if (valueFacet) {
      if (valueFacet.groupLog) {
        options.scales.yAxes[0].type = 'logarithmic';
        options.scales.yAxes[0].stacked = false;
      } else {
        options.scales.yAxes[0].type = 'linear';
      }
    }
  }
  if (acceptTimeAxis(view.model)) {
    if (filter.primary && filter.primary.displayDatetime) {
      options.scales.xAxes[0].type = 'time';
      options.scales.xAxes[0].time = {
        displayFormat: filter.primary.groupingTimeFormat,
        parser: function (d) {
          // The datapoints are already momentjs objects via the timeGroupFn
          return d;
        }
      };
    }
  }

  // mouse selection callbacks
  if (view.model.getType() !== 'linechart' && view.model.getType() !== 'radarchart') {
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
  var xgroups = this._Ampersandview._xgroups;

  if (elements.length > 0) {
    var clickedBin = xgroups.models[elements[0]._index];
    that.filter.update(clickedBin);
  } else {
    that.filter.reset();
  }
  that.filter.updateDataFilter();
}

module.exports = AmpersandView.extend({
  template: templates.includes.widgetcontent,
  renderContent: function () {
    var filter = this.model.filter;

    // add a default chart to the view
    initChart(this);

    // redraw when the widgets indicates new data is available
    filter.on('newData', function () {
      this.update();
    }, this);

    // reset the plot when the facets change
    filter.on('newFacets', function () {
      destroyChart(this);
      initChart(this);
      if (filter.primary) {
        this.update();
      }
    }, this);

    // stop listening to events when this view is removed
    this.on('remove', function () {
      filter.off('newData');
      filter.off('newFacets');
      destroyChart(this);
    });

    // apply current selection
    filter.updateDataFilter();
  },
  update: function () {
    var model = this.model;
    var filter = this.model.filter;
    var chartData = this._config.data;

    var AtoI = {};
    var BtoJ = {};

    // prepare data structure, reuse as much of the previous data arrays as possible
    // to prevent massive animations on every update

    // labels along the xAxes, keep a reference to resolve mouseclicks
    var xgroups = filter.primary.groups;
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
    if (filter.secondary) {
      ygroups = filter.secondary.groups;
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
    var isSelected = filter.filterFunction;

    filter.data.forEach(function (group) {
      if (AtoI.hasOwnProperty(group.a) && BtoJ.hasOwnProperty(group.b)) {
        var i = AtoI[group.a];
        var j = BtoJ[group.b];

        // data value
        chartData.datasets[j].data[i] = parseFloat(group.c) || 0;

        // data color
        if (hasPerItemColor(model)) {
          if (isSelected(xgroups.models[i].value)) {
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

    // Logarithmic plots

    // prevent zero values in logarithmic plots, map them to 10% of the lowest value in the plot
    var valueFacet = filter.tertiary || filter.secondary || filter.primary;
    var minval = Number.MAX_VALUE;

    if (valueFacet && valueFacet.groupLog) {
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

Chart.pluginService.register({

  afterDraw: function (chartInstance) {
        // console.log("widget-chartjs.js::290: afterDraw");
    var ctx = chartInstance.chart.ctx;
    var chartType = chartInstance.config.type;

    if (chartType === 'horizontalBar') {
            // console.log('Setting labels for horizontalBar chart.');
      ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontFamily, 'normal', Chart.defaults.global.defaultFontFamily);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'left';
      ctx.fillStyle = '#444';

      chartInstance.data.datasets.forEach(function (dataset) {
        for (var i = 0; i < dataset.data.length; i++) {
          var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model;
          var xMin = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._xScale.min;
          var xPos = xMin + 10;
          ctx.fillText(chartInstance.data.labels[i], xPos, model.y - 7);
        }
      });
    }
  }

});
