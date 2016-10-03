var AmpersandView = require('ampersand-view');
var templates = require('../templates');
var Plotly = require('plotly.js');


function initChart (view) {
  var filter = view.model.filter;

  // Configure plot
  view._config = view.model.plotlyConfig();
  var options = view._config.options;
  var layout = view.model.plotLayout();
  var chartData = view._config.data;
  var graphDiv = view.queryByHook('chart-area-plotly');


  // console.log('-- filter --\n', filter);
  // console.log('-- view._config --\n', view._config);
  // console.log('-- options --\n', options);
  // console.log('-- layout --\n', layout);
  // console.log('-- chartData --\n', chartData);
  // console.log('-- graphDiv --\n', graphDiv);


//  view._plotly = Plotly.newPlot(graphDiv, mydata, mylayout, options);


//  view._plotly = Plotly.newPlot(graphDiv, chartData, layout, options);
  view._plotly = 0;

  // In callbacks on the chart we will need the view, so store a reference
  view._plotly._Ampersandview = view;
}


module.exports = AmpersandView.extend({
  template: templates.includes.widgetcontentPlotly,
  renderContent: function () {
    var filter = this.model.filter;

    // redraw when the model indicates new data is available
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

    this._config = this.model.plotlyConfig();
    var options = this._config.options;
    var layout = this.model.plotLayout();
    var chartData = this._config.data;
    var graphDiv = this.queryByHook('chart-area-plotly');


    // //console.log(filter.partitions);
    if (filter.isConfigured && (!this._plotly)) {
      initChart(this);
    }

    var partitionA = filter.partitions.get(1, 'rank');
    var partitionB = filter.partitions.get(2, 'rank');
    var partitionC = filter.partitions.get(3, 'rank');

    var xgroups = partitionA.groups;
    var ygroups = partitionB.groups;
    var zgroups = partitionC.groups;


    xgroups.forEach(function (xbin, i) {
      chartData.x[i] = xbin.value;
//      AtoI[xbin.value.toString()] = i;
    });

    ygroups.forEach(function (ybin, i) {
      chartData.y[i] = ybin.value;
//      AtoI[xbin.value.toString()] = i;
    });

    zgroups.forEach(function (zbin, i) {
      chartData.z[i] = zbin.value;
//      AtoI[xbin.value.toString()] = i;
    });

    this._xgroups = xgroups;
    this._ygroups = ygroups;
    this._zgroups = zgroups;

    console.log(chartData);
    console.log(layout);
    console.log(options);

    // Hand over to Plotly for actual plotting
    this._plotly = Plotly.newPlot(graphDiv, [chartData], layout, options);

  }
});
