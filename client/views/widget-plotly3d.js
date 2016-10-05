var AmpersandView = require('ampersand-view');
var templates = require('../templates');
var Plotly = require('plotly.js');

function initChart (view) {
  view._config = view.model.plotlyConfig();
  var options = view._config.options;
  var layout = view._config.layout;
  var graphDiv = view.queryByHook('chart-area-plotly');



  view._plotly = Plotly.newPlot(graphDiv, [], layout, options);

  // In callbacks on the chart we will need the view, so store a reference
  view._plotly._Ampersandview = view;
}

function updateScatter (view) {
  var filter = view.model.filter;
  var chartData = view._config.data;

  var primary = filter.partitions.get('1', 'rank');
  var secondary = filter.partitions.get('2', 'rank');
  var tertiary = filter.partitions.get('3', 'rank');

  var xgroups = primary.groups;
  var ygroups = secondary.groups;
  var zgroups = tertiary.groups;

  // create lookup hashes
  var AtoI = {};
  var BtoJ = {};
  var CtoK = {};

  xgroups.forEach(function (xbin, i) {
    AtoI[xbin.value.toString()] = i;
  });
  ygroups.forEach(function (ybin, j) {
    BtoJ[ybin.value.toString()] = j;
  });
  zgroups.forEach(function (zbin, j) {
    CtoK[zbin.value.toString()] = j;
  });

    // add data
  var d = 0;
  filter.data.forEach(function (group) {
    if (AtoI.hasOwnProperty(group.a) && BtoJ.hasOwnProperty(group.b) && CtoK.hasOwnProperty(group.c)) {
      var val = parseInt(group.aa) || 0;
      if (val > 0) {
        var i = AtoI[group.a];
        var j = BtoJ[group.b];
        var k = CtoK[group.c];

        if (i === +i && j === +j && k === +k) {
          chartData.x[i] = xgroups.models[i].value;
          chartData.y[j] = ygroups.models[j].value;
          chartData.z[k] = zgroups.models[k].value;
          d++;
        }
      }
    }
  });
}

module.exports = AmpersandView.extend({
  template: templates.includes.widgetcontentPlotly,
  renderContent: function () {
    var filter = this.model.filter;

    if (!this._plotly) {
      initChart(this);
    }

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
    // var model = this.model;
    var filter = this.model.filter;

    this._config = this.model.plotlyConfig();
    var options = this._config.options;
    var layout = this._config.layout;
    var chartData = this._config.data;
    var graphDiv = this.queryByHook('chart-area-plotly');

    if (filter.isConfigured && (!this._plotly)) {
      initChart(this);
    }

    if (filter.isConfigured) {
      updateScatter(this);
    }

    // Hand over to Plotly for actual plotting
    this._plotly = Plotly.newPlot(graphDiv, [chartData], layout, options);
  }
});
